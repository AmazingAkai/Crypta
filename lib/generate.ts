import OpenAI from "openai";

let client: OpenAI;
const encoder = new TextEncoder();

function getClient() {
  if (client) return client;

  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  return client;
}

export async function generateResponse(
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  const completion = await getClient().chat.completions.create({
    stream: true,
    model: `hf:${model}`,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. Your name is Crypta.",
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
}
