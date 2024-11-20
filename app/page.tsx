"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Eraser, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { models } from "@/lib/constants";
import type { Message } from "@/lib/types";

const decoder = new TextDecoder();

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0].name);

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
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage],
        }),
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
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <motion.div
              key={index}
              className={`max-w-lg p-3 rounded-lg text-white ${
                message.role === "user"
                  ? "bg-blue-500 self-end"
                  : "bg-secondary self-start"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
            </motion.div>
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[3rem] font-semibold opacity-20 select-none">
              Write a message to chat with AI
            </p>
          </div>
        )}
      </div>
      <div className="relative w-full px-4 py-4 border-t">
        <div className="relative max-w-2xl mx-auto flex items-center space-x-2">
          <Button
            onClick={() => setMessages([])}
            variant="destructive"
            size="icon"
            disabled={isStreaming}
          >
            <Eraser className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            size="icon"
            disabled={isStreaming}
          >
            <Settings className="w-5 h-5" />
          </Button>
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
            className="absolute right-2 bottom-1/2 transform translate-y-1/2"
            variant="ghost"
            size="icon"
            disabled={isStreaming}
          >
            <Send className="w-5 h-5" />
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Model</DialogTitle>
              </DialogHeader>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue>{selectedModel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-sm text-gray-500">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
