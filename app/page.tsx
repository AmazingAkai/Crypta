"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

import type { Message } from "@/lib/types";

const decoder = new TextDecoder();

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const sendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage: Message = { role: "user", content: currentInput.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.body) throw new Error("Readable stream not supported");

      const reader = response.body.getReader();

      let finalContent = "";

      let done, value;
      while (!done) {
        ({ done, value } = await reader.read());

        const chunk = decoder.decode(value, { stream: true });
        finalContent += chunk;

        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: finalContent } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error streaming message:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  return (
    <div className="flex flex-col h-screen">
      <div
        ref={chatContainerRef}
        className="flex flex-col flex-grow overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-lg p-3 rounded-lg text-white ${
              message.role === "user"
                ? "bg-blue-500 self-end"
                : "bg-secondary self-start"
            }`}
          >
            {message.content ? (
              <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
                className="prose prose-invert"
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-48" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="relative w-full px-4 py-4 border-t">
        <div className="relative max-w-2xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Chat with AI"
            className="w-full resize-none pr-14 py-4 flex items-center"
            disabled={isStreaming}
          />

          <Button
            onClick={sendMessage}
            className="absolute right-2 bottom-1/2 transform translate-y-1/2 h-10 w-10 p-0"
            variant="ghost"
            disabled={isStreaming}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
