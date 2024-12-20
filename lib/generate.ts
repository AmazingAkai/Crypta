import OpenAI from "openai";

let client: OpenAI;
const encoder = new TextEncoder();

const getClient = (): OpenAI => {
  if (client) return client;

  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  return client;
};

export const generateResponse = async (
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<ReadableStream<Uint8Array>> => {
  const completion = await getClient().chat.completions.create({
    stream: true,
    model: `hf:${model}`,
    messages: [
      {
        role: "system",
        content:
          process.env.OPENAI_PERSONALITY || "You are a helpful assistant.",
      },
      ...messages,
    ],
  });
  const iterator = completion[Symbol.asyncIterator]();

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        if (value.choices[0].delta.content) {
          controller.enqueue(encoder.encode(value.choices[0].delta.content));
        }
      }
    },
  });
};
