import { generateResponse } from "@/lib/generate";
import { type NextRequest } from "next/server";
import { models } from "@/lib/constants";

export const POST = async (request: NextRequest) => {
  const { model, messages } = await request.json();

  if (!model || !models.find((m) => m.name === model)) {
    return new Response("Invalid model", { status: 400 });
  }

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

  const stream = await generateResponse(model, messages);
  return new Response(stream);
};
