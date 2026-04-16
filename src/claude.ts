import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateContent(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }
  return block.text;
}
