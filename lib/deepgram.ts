import { createClient } from "@deepgram/sdk";
import type { DeepgramClient } from "@deepgram/sdk";

let deepgram: DeepgramClient;

function getClient() {
  if (deepgram) return deepgram;

  deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  return deepgram;
}

const transcribe = async (buffer: Buffer) => {
  const { result, error } = await getClient().listen.prerecorded.transcribeFile(
    buffer,
    {
      model: "nova-2",
      smart_format: true,
    }
  );

  if (error) throw error;

  return result.results.channels.at(0)?.alternatives.at(0)?.transcript;
};
