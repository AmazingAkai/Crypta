import { generateResponse } from "@/lib/generate";
import { type NextRequest, NextResponse } from "next/server";
import { models } from "@/lib/constants";
import { corsMiddleware } from "@/lib/middleware";

export const POST = corsMiddleware(
  async (request: NextRequest): Promise<NextResponse> => {
    const { model, messages } = await request.json();

    if (!model || !models.find((m) => m.name === model)) {
      return new NextResponse("Invalid model", { status: 400 });
    }

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.some(
        (message) => message.role !== "user" && message.role !== "assistant"
      ) ||
      messages.some((message) => !message.content)
    ) {
      return new NextResponse("Invalid messages format", { status: 400 });
    }

    const stream = await generateResponse(model, messages);
    return new NextResponse(stream);
  }
);
