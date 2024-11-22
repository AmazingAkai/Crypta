import { type NextRequest } from "next/server";
import { transcribe } from "@/lib/deepgram";

export const POST = async (request: NextRequest) => {
  const { audio } = await request.json();

  if (!audio) {
    return new Response("Missing audio", { status: 400 });
  }

  const buffer = Buffer.from(audio, "base64");
  const text = await transcribe(buffer);

  return new Response(text);
};
