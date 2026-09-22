import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { assertProductionEnv, webOrigin } from "./env";

async function bootstrap() {
  assertProductionEnv();

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: webOrigin(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Lets OnModuleDestroy run, so the queue and worker close cleanly.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.log(`Beacon API listening on http://0.0.0.0:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start the Beacon API", error);
  process.exit(1);
});
