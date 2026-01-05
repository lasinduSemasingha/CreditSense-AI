"use client";
/*number of messages*/

import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "./types";
import { forwardRef } from "react";

type MessageListProps = {
  messages: Message[];
  isTyping: boolean;
  onPlayAudio: (audioUrl: string) => void;
  endRef: React.RefObject<HTMLDivElement | null>;
};

export function MessageList({ messages, isTyping, onPlayAudio, endRef }: MessageListProps) {
  return (
    <>
      {messages.map((message) => {
        // Hide empty assistant placeholder bubble while streaming
        if (message.role === "assistant" && !message.content.trim()) {
          return null;
        }
        return (
          <MessageBubble key={message.id} message={message} onPlayAudio={onPlayAudio} />
        );
      })}

      {isTyping && <TypingIndicator />}

      <div ref={endRef} aria-hidden className="h-px" />
    </>
  );
}
