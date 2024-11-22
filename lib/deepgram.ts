import { createClient } from "@deepgram/sdk";
import type { DeepgramClient } from "@deepgram/sdk";

let deepgram: DeepgramClient;

const getClient = (): DeepgramClient => {
  if (deepgram) return deepgram;

  deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  return deepgram;
};

export const transcribe = async (buffer: Buffer): Promise<string> => {
  const { result, error } = await getClient().listen.prerecorded.transcribeFile(
    buffer,
    {
      model: "nova-2",
      smart_format: true,
    }
  );

  if (error) throw error;

  return result.results.channels.at(0)?.alternatives.at(0)?.transcript || "";
};

export const getAudio = async (text: string): Promise<Buffer | null> => {
  const response = await getClient().speak.request(
    { text },
    {
      model: "aura-asteria-en",
      encoding: "linear16",
      container: "wav",
    }
  );

  const stream = await response.getStream();
  if (!stream) return null;

  const buffer = await getAudioBuffer(stream);
  return buffer;
};

const getAudioBuffer = async (
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const dataArray = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    dataArray.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(dataArray.buffer);
};
