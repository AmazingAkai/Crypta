import { type NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/lib/deepgram";
import { corsMiddleware } from "@/lib/middleware";

export const POST = corsMiddleware(
  async (request: NextRequest): Promise<NextResponse> => {
    const { audio } = await request.json();

    if (!audio) {
      return new NextResponse("Missing audio", { status: 400 });
    }

    const buffer = Buffer.from(audio, "base64");
    const text = await transcribe(buffer);

    return new NextResponse(text);
  }
);
