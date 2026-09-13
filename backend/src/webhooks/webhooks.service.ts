import { randomBytes } from "crypto";
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { Queue, Worker, type Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { OrgsService } from "../orgs/orgs.service";
import { CreateWebhookDto } from "./webhooks.dto";
import { signatureHeader } from "./signature";

type DeliveryJob = { deliveryId: string };

@Injectable()
export class WebhooksService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(WebhooksService.name);
  private queue: Queue<DeliveryJob> | null = null;
  private worker: Worker<DeliveryJob> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgs: OrgsService,
  ) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.log.warn(
        "REDIS_URL is not set — webhook delivery will use the Postgres outbox only",
      );
      return;
    }
    try {
      this.queue = new Queue("webhook-delivery", { connection: { url: redisUrl } });
      this.worker = new Worker<DeliveryJob>(
        "webhook-delivery",
        async (job: Job<DeliveryJob>) => {
          await this.deliver(job.data.deliveryId);
        },
        { connection: { url: redisUrl }, concurrency: 5 },
      );
      this.worker.on("failed", (job, err) => {
        this.log.warn(`Webhook job ${job?.id} failed: ${err.message}`);
      });
      this.log.log("BullMQ webhook worker connected");
    } catch (error) {
      this.log.warn(
        `Redis unavailable (${(error as Error).message}) — falling back to outbox polling`,
      );
      this.queue = null;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async list(userId: string) {
    const { organizationId } = await this.orgs.forUser(userId);
    return this.prisma.webhookEndpoint.findMany({
      where: { organizationId },
      orderBy: { id: "desc" },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    });
  }

  async create(userId: string, dto: CreateWebhookDto) {
    const { organizationId } = await this.orgs.forUser(userId);
    return this.prisma.webhookEndpoint.create({
      data: {
        organizationId,
        url: dto.url,
        secret: randomBytes(24).toString("hex"),
        events: dto.events,
      },
    });
  }

  async remove(userId: string, id: string) {
    const { organizationId } = await this.orgs.forUser(userId);
    const existing = await this.prisma.webhookEndpoint.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException("Webhook not found");
    }
    await this.prisma.webhookEndpoint.delete({ where: { id } });
    return { ok: true };
  }

  async enqueue(organizationId: string, event: string, payload: unknown) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { organizationId, active: true, events: { has: event } },
    });

    for (const endpoint of endpoints) {
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: payload as object,
        },
      });
      if (this.queue) {
        await this.queue.add(
          "deliver",
          { deliveryId: delivery.id },
          {
            attempts: 5,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        );
      }
    }
  }

  @Interval(4000)
  async drainOutbox() {
    const staleBefore = this.queue
      ? new Date(Date.now() - 15_000)
      : new Date();
    const pending = await this.prisma.webhookDelivery.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: staleBefore },
      },
      take: 10,
      orderBy: { createdAt: "asc" },
    });
    for (const row of pending) {
      await this.deliver(row.id);
    }
  }

  async deliver(deliveryId: string) {
    const claimed = await this.prisma.webhookDelivery.updateMany({
      where: { id: deliveryId, status: { in: ["PENDING", "FAILED"] } },
      data: { status: "PROCESSING", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) {
      return;
    }

    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!delivery) {
      return;
    }

    const body = JSON.stringify({
      event: delivery.event,
      deliveredAt: new Date().toISOString(),
      data: delivery.payload,
    });
    const signature = signatureHeader(delivery.endpoint.secret, body);

    try {
      const response = await fetch(delivery.endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Beacon-Event": delivery.event,
          "X-Beacon-Signature": signature,
        },
        body,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: "SUCCESS", deliveredAt: new Date(), lastError: null },
      });
    } catch (error) {
      const lastError = (error as Error).message;
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: delivery.attempts >= 5 ? "FAILED" : "PENDING",
          lastError,
        },
      });
    }
  }
}
