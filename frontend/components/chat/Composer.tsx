"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Mic, MicOff, Send, UserPlus, Loader2 } from "lucide-react";

type ComposerProps = {
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
  isRecording: boolean;
  isAnalyzingImage?: boolean;
  isTranscribing?: boolean;
  isSynthesizing?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  hasSelectedImage: boolean;
};

export function Composer({
  input,
  onInputChange,
  onSend,
  isTyping,
  isRecording,
  isAnalyzingImage = false,
  isTranscribing = false,
  isSynthesizing = false,
  onStartRecording,
  onStopRecording,
  hasSelectedImage,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="flex gap-2">
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={
            isTyping || isAnalyzingImage || isTranscribing || isSynthesizing
          }
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <Input
          placeholder="Ask about leasing options, pricing, models..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          className="flex-1"
          disabled={isAnalyzingImage || isTranscribing || isSynthesizing}
        />
        <Button
          onClick={onSend}
          disabled={
            (!input.trim() && !hasSelectedImage) ||
            isTyping ||
            isAnalyzingImage ||
            isTranscribing ||
            isSynthesizing
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1 min-h-4">
        {hasSelectedImage && !isAnalyzingImage && (
          <div className="text-xs text-muted-foreground">
            Image attached. It will be analyzed when you send.
          </div>
        )}
        {isAnalyzingImage && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing image…
          </div>
        )}
        {isTranscribing && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing audio…
          </div>
        )}
        {isSynthesizing && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating voice
            reply…
          </div>
        )}
      </div>
    </div>
  );
}
