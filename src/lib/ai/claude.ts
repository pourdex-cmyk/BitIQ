import Anthropic from "@anthropic-ai/sdk";
import { getRequiredEnv } from "@/lib/env";

export const anthropic = new Anthropic({
  apiKey: getRequiredEnv("ANTHROPIC_API_KEY"),
});

export const AI_MODEL = "claude-sonnet-4-5";

export async function streamText(
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<string> {
  let fullText = "";
  const stream = await anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullText += chunk.delta.text;
      onChunk(chunk.delta.text);
    }
  }

  return fullText;
}

export async function generateJson<T>(
  systemPrompt: string,
  userMessage: string
): Promise<T> {
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
    content.text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  return JSON.parse(jsonMatch[1]) as T;
}
