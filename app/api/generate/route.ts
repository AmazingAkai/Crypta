import { generateResponse } from "@/lib/generate";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.some(
      (message) => message.role !== "user" && message.role !== "assistant"
    ) ||
    messages.some((message) => !message.content)
  ) {
    return new Response("Invalid messages format", { status: 400 });
  }

  const stream = await generateResponse(messages);
  return new Response(stream);
}
