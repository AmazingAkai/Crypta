import { type NextRequest, NextResponse } from "next/server";
import { getAudio } from "@/lib/deepgram";
import { deepgramTTSModels } from "@/lib/constants";
import { corsMiddleware } from "@/lib/middleware";

export const POST = corsMiddleware(
  async (request: NextRequest): Promise<NextResponse> => {
    const { text, model } = await request.json();

    if (!text || !model) {
      return new NextResponse("Missing text or model", { status: 400 });
    }

    if (!deepgramTTSModels.find((m) => m.name === model)) {
      return new NextResponse("Invalid model", { status: 400 });
    }

    const buffer = await getAudio(text, model);
    if (!buffer) {
      return new NextResponse("Failed to generate audio", { status: 500 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/wav",
      },
    });
  }
);
