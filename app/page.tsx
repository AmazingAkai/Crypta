import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-[3rem] font-semibold opacity-20 select-none">
          Write a message to chat with AI
        </p>
      </div>
      <div className="absolute bottom-4 w-full px-4">
        <div className="relative max-w-2xl mx-auto">
          <Textarea
            placeholder="Chat with AI"
            className="w-full resize-none pr-14 py-4 flex items-center"
          />
          <Button
            className="absolute right-2 bottom-1/2 transform translate-y-1/2 h-10 w-10 p-0"
            variant="ghost"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
