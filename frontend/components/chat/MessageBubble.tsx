"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, FileText, User, Volume2 } from "lucide-react";
import type { Message } from "./types";
import ReactMarkdown from "react-markdown";

type MessageBubbleProps = {
  message: Message;
  onPlayAudio: (audioUrl: string) => void;
};

export function MessageBubble({ message, onPlayAudio }: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-3 ${
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* <Avatar className="h-8 w-8">
        <AvatarFallback
          className={
            message.role === "assistant"
              ? "bg-primary/10 text-primary"
              : "bg-accent/10 text-accent"
          }
        >
          {message.role === "assistant" ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar> */}
      <Avatar className="h-8 w-8">
        <AvatarFallback
          className={
            message.role === "assistant"
              ? "bg-primary/10 text-primary"
              : message.role === "agent"
              ? "bg-green-500/10 text-green-600"
              : "bg-accent/10 text-accent"
          }
        >
          {message.role === "assistant" ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      {/* <div
        className={`rounded-lg px-4 py-2 max-w-[80%] ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      > */}
      <div
        className={`rounded-lg px-4 py-2 max-w-[80%] ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : message.role === "agent"
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-muted"
        }`}
      >
        {message.type === "document" && message.documentName && (
          <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 mb-2 text-xs font-medium ${
            message.role === "user"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary/10 text-primary"
          }`}>
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {message.documentName}
          </div>
        )}
        {message.type === "image" && message.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.imageUrl || "/placeholder.svg"}
            alt="Uploaded"
            className="rounded-md mb-2 max-w-full h-auto max-h-64 object-cover"
          />
        )}
        {message.type === "voice" && message.audioUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlayAudio(message.audioUrl!)}
            className={`mb-2 ${
              message.role === "user"
                ? "text-primary-foreground hover:bg-primary/20"
                : ""
            }`}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Play Audio
          </Button>
        )}
        <div className={`text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:font-semibold ${
            message.role === "user"
              ? "prose-invert"
              : "dark:prose-invert"
          }`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <p
          className={`text-xs mt-1 ${
            message.role === "user"
              ? "text-primary-foreground/70"
              : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
