import { type NextRequest } from "next/server";
import { getAudio } from "@/lib/deepgram";
import { deepgramTTSModels } from "@/lib/constants";

export const POST = async (request: NextRequest) => {
  const { text, model } = await request.json();

  if (!text || !model) {
    return new Response("Missing text or model", { status: 400 });
  }

  if (!deepgramTTSModels.find((m) => m.name === model)) {
    return new Response("Invalid model", { status: 400 });
  }

  const buffer = await getAudio(text, model);
  if (!buffer) {
    return new Response("Failed to generate audio", { status: 500 });
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/wav",
    },
  });
};
