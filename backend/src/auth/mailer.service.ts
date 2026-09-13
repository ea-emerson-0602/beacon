import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MailerService {
  private readonly log = new Logger(MailerService.name);

  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.log.warn(`No mailer configured — password reset URL: ${resetUrl}`);
      return;
    }

    const from = process.env.MAIL_FROM ?? "Beacon <noreply@beacon.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your Beacon password",
        text: [
          "We received a request to reset your Beacon password.",
          "",
          `Open this link within the next hour: ${resetUrl}`,
          "",
          "If you did not ask for this, you can ignore the email.",
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      this.log.error(`Resend rejected the reset email: ${detail}`);
      throw new Error("Could not send the reset email");
    }
  }
}
