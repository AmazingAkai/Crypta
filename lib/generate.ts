import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const encoder = new TextEncoder();

export async function generateResponse(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  const completion = await client.chat.completions.create({
    stream: true,
    model: "hf:meta-llama/Meta-Llama-3.1-405B-Instruct",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
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
