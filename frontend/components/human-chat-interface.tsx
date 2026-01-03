"use client";

import React, { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppHeader } from "@/components/app-header";
import { MessageList } from "@/components/chat/MessageList";
import type { Message } from "@/components/chat/types";
import { toast } from "sonner";
import { HumanAgentBanner } from "./chat/HumanAgentBanner";
import { useChatQueueById } from "@/hooks/use-chat-queues";
import { useAddMessageToChatQueue } from "@/hooks/use-chat-message";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";

type Props = {
  humanChatId?: string;
};

export default function HumanChatInterface({ humanChatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: chatQueue, isLoading: isLoadingChatQueue } = useChatQueueById(
    humanChatId || ""
  );
  const { mutate: addMessageToChatQueue, isPending: isAddingMessage } =
    useAddMessageToChatQueue();

  // When chatQueue loads, populate the messages state with its history (UI-only)
  useEffect(() => {
    if (!chatQueue || !Array.isArray((chatQueue as any).messages)) return;
    try {
      const serverMessages = (chatQueue as any).messages as Array<any>;
      if (!serverMessages.length) return;

      const mapped: Message[] = serverMessages.map((m) => ({
        id: String(m.id),
        // server may use 'system' role; map to 'assistant' for UI Message type
        role:
          m.role === "system" ? "assistant" : (m.role as "assistant" | "user"),
        content: m.content || "",
        type: (m.type as any) || "text",
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        // if attachments exist and contain audio or image urls, map them to fields the UI expects
        ...(m.attachments && m.attachments.audioUrl
          ? { audioUrl: m.attachments.audioUrl }
          : {}),
        ...(m.attachments && m.attachments.imageUrl
          ? { imageUrl: m.attachments.imageUrl }
          : {}),
      }));

      setMessages(mapped);
    } catch (err) {
      console.warn("Failed to map chatQueue messages:", err);
    }
  }, [chatQueue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = (input || "").trim();
    if (!text) return;

    const userMessage: Message = {
      id: newId(),
      role: "user",
      content: text,
      type: "text",
      timestamp: new Date(),
    };

    // Optimistically append message locally
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Persist the message to the chat queue in the database
    if (!humanChatId) {
      // if there's no queue id, warn the user
      toast.error("No human chat id available. Message not saved.");
      return;
    }

    addMessageToChatQueue(
      { queueId: humanChatId, message: userMessage },
      {
        onError: (err) => {
          console.error("Failed to add message to chat queue:", err);
          // revert optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          toast.error("Failed to send message. Please try again.");
        },
      }
    );
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `You are now connected to a human agent${
          humanChatId ? ` (ID: ${humanChatId})` : ""
        }. This chat supports text messages only.`,
        type: "text",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    toast.info("Chat cleared");
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader onClearChat={clearChat} />

      {/* Fixed banner under the AppHeader with backdrop blur like the header */}
      <div className="fixed top-14 left-0 right-0 w-full z-50 pointer-events-none">
        <div className="mx-auto max-w-3xl px-4">
          <div className="w-full bg-card/50 backdrop-blur-sm border-b rounded-lg pointer-events-auto mt-2">
            <div className="px-0">
              <HumanAgentBanner show={true} status={chatQueue?.status} />
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 pt-28">
        <div className="max-w-3xl mx-auto space-y-4">
          <MessageList
            messages={messages}
            isTyping={false}
            onPlayAudio={() => {}}
            endRef={messagesEndRef}
          />
        </div>
      </ScrollArea>

      <div className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message to the human agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
              disabled={
                isLoadingChatQueue ||
                isAddingMessage ||
                chatQueue?.status === "resolved"
              }
            />
            <Button
              onClick={handleSend}
              disabled={
                isLoadingChatQueue ||
                isAddingMessage ||
                chatQueue?.status === "resolved"
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
