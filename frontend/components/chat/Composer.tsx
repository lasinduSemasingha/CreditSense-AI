"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, Mic, MicOff, Send, X, Loader2 } from "lucide-react";

type ComposerProps = {
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
  isRecording: boolean;
  isAnalyzingImage?: boolean;
  isTranscribing?: boolean;
  isSynthesizing?: boolean;
  isExtractingDoc?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  selectedImage: File | null;
  selectedDocument: File | null;
  onFileSelect: (file: File) => void;
  onClearImage: () => void;
  onClearDocument: () => void;
};

const ACCEPT = "image/*,.pdf,.docx,.doc,.txt,.csv,.md,.json";

export function Composer({
  input,
  onInputChange,
  onSend,
  isTyping,
  isRecording,
  isAnalyzingImage = false,
  isTranscribing = false,
  isSynthesizing = false,
  isExtractingDoc = false,
  onStartRecording,
  onStopRecording,
  selectedImage,
  selectedDocument,
  onFileSelect,
  onClearImage,
  onClearDocument,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = isTyping || isAnalyzingImage || isTranscribing || isSynthesizing || isExtractingDoc;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  };

  const canSend = (input.trim() || selectedImage || selectedDocument) && !isBusy;

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Attachment previews */}
      {(selectedImage || selectedDocument) && (
        <div className="flex flex-wrap gap-2">
          {selectedImage && (
            <div className="relative inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="preview"
                className="h-10 w-10 rounded object-cover"
              />
              <span className="max-w-35 truncate">{selectedImage.name}</span>
              <button onClick={onClearImage} className="ml-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {selectedDocument && (
            <div className="relative inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
              <FileUp className="h-4 w-4 shrink-0 text-primary" />
              <span className="max-w-45 truncate">{selectedDocument.name}</span>
              <button onClick={onClearDocument} className="ml-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {/* Mic */}
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isBusy}
          title={isRecording ? "Stop recording" : "Start voice input"}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        {/* File / Image upload */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          title="Attach image or document"
        >
          <FileUp className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />

        <Input
          placeholder="Ask about leasing options, pricing, models..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && canSend && onSend()}
          className="flex-1"
          disabled={isBusy}
        />

        <Button onClick={onSend} disabled={!canSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Status row */}
      <div className="flex flex-col gap-1 min-h-4">
        {isExtractingDoc && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading document…
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
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating voice reply…
          </div>
        )}
      </div>
    </div>
  );
}

