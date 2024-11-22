import { type NextRequest } from "next/server";
import { getAudio } from "@/lib/deepgram";

export const POST = async (request: NextRequest) => {
  const { text } = await request.json();

  if (!text) {
    return new Response("Missing text", { status: 400 });
  }

  const buffer = await getAudio(text);
  if (!buffer) {
    return new Response("Failed to generate audio", { status: 500 });
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/wav",
    },
  });
};
