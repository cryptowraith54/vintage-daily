function getWebhookUrl(): string {
  const url = process.env.SLACK_WEBHOOK_URL_VINTAGE;
  if (!url) {
    throw new Error("SLACK_WEBHOOK_URL_VINTAGE must be set");
  }
  return url;
}

export async function sendSlackMessage(text: string): Promise<void> {
  const WEBHOOK_URL = getWebhookUrl();
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Slack Webhook error ${res.status}: ${body}`);
  }
}
