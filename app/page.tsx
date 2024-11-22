"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Eraser, Settings, Mic, StopCircle, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-prism-plus";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
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

import "prismjs/themes/prism-tomorrow.css";

const decoder = new TextDecoder();
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5 MB

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0].name);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const audioCache = useRef<Map<string, Blob>>(new Map());

  const fetchTTS = async (text: string) => {
    if (audioCache.current.has(text)) {
      return audioCache.current.get(text);
    }

    if (text.length === 0 || text.length > 2000) {
      toast({
        variant: "destructive",
        title: "TTS error",
        description: "Text must be between 1 and 2000 characters.",
      });
      return null;
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch TTS");
      }

      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/wav" });
      audioCache.current.set(text, blob);

      return blob;
    } catch (error) {
      console.error("Error fetching TTS:", error);
      toast({
        variant: "destructive",
        title: "TTS error",
        description: "There was an issue generating the audio.",
      });
      return null;
    }
  };

  const playAudio = (audioBlob: Blob) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
  };

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
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem streaming your message.",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Your browser does not support audio recording.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        audioChunksRef.current = [];

        const arrayBuffer = await audioBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.byteLength > MAX_AUDIO_SIZE) {
          toast({
            variant: "destructive",
            title: "Uh oh! Failed to transcribe.",
            description: "Audio file is too large.",
          });
          setIsTranscribing(false);
          return;
        }

        try {
          const transcriptionResponse = await fetch("/api/transcribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ audio: buffer.toString("base64") }),
          });

          if (!transcriptionResponse.ok) {
            throw new Error("Failed to transcribe audio.");
          }

          setCurrentInput(await transcriptionResponse.text());
        } catch (err) {
          console.error("Transcription error:", err);
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem transcribing your message.",
          });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not access your microphone.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
              className={`max-w-screen p-3 rounded-lg text-white ${
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
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  className="prose prose-invert"
                  components={{
                    table: ({ node, ...props }) => (
                      <table
                        className="min-w-full table-auto border-collapse border border-gray-300"
                        {...props}
                      />
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className="border border-gray-300 px-4 py-2 text-left font-bold"
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className="border border-gray-300 px-4 py-2"
                        {...props}
                      />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr className="hover:bg-zinc-700" {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-40 md:w-96" />
                  <Skeleton className="h-4 w-40 md:w-96" />
                  <Skeleton className="h-4 w-40 md:w-96" />
                  <Skeleton className="h-4 w-40 md:w-96" />
                  <Skeleton className="h-4 w-20 md:w-48" />
                </div>
              )}
              {message.role === "assistant" && message.content && (
                <Button
                  onClick={async () => {
                    setIsPlaying(true);
                    try {
                      const audioBlob = await fetchTTS(message.content);
                      if (audioBlob) {
                        playAudio(audioBlob);
                      }
                    } finally {
                      setIsPlaying(false);
                    }
                  }}
                  disabled={isPlaying}
                  variant="outline"
                  size="icon"
                  className="mt-2"
                >
                  <Volume2 className="w-6 h-6" />
                </Button>
              )}
            </motion.div>
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[1.5rem] md:text-[3rem] font-semibold opacity-20 select-none">
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
            className="w-15 h-15 p-3"
            disabled={isStreaming || isTranscribing}
          >
            <Eraser className="!w-[1rem] !h-[1rem]" />
          </Button>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            className="w-15 h-15 p-3"
            disabled={isStreaming || isTranscribing}
          >
            <Settings className="!w-[1rem] !h-[1rem]" />
          </Button>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className="w-15 h-15 p-3"
            disabled={isStreaming || isTranscribing}
          >
            {isRecording ? (
              <StopCircle className="!w-[1rem] !h-[1rem]" />
            ) : (
              <Mic className="!w-[1rem] !h-[1rem]" />
            )}
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
            className="min-h-11 h-11 w-full resize-none pr-14 flex items-center"
            disabled={isStreaming || isTranscribing}
          />
          <Button
            onClick={sendMessage}
            className="absolute right-2 bottom-1/2 transform translate-y-1/2"
            variant="ghost"
            size="icon"
            disabled={isStreaming || isTranscribing}
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
                <SelectContent className="max-h-60 overflow-auto">
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
