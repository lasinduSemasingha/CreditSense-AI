"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppHeader } from "@/components/app-header";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import type { Message, MessageType } from "@/components/chat/types";
import { toast } from "sonner";
import { useCreateChatQueue } from "@/hooks/use-chat-queues";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserRound } from "lucide-react";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your motorcycle leasing assistant. How can I help you today? Feel free to ask about our leasing options, pricing, available models, or any other questions you might have.",
      type: "text",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [showContactAgentDialog, setShowContactAgentDialog] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<{ final: string; interim: string }>({ final: "", interim: "" });
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const router = useRouter();

  const { mutate: createChatQueue } = useCreateChatQueue();

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const toAPIMessages = (msgs: Message[]) =>
    msgs.map((m) => ({ role: m.role, content: m.content }));

  // Strip markdown so TTS doesn't speak "star star" or "hash hash"
  const stripMarkdown = (text: string): string =>
    text
      .replace(/#{1,6}\s?/g, "")          // headings
      .replace(/\*\*(.+?)\*\*/g, "$1")    // bold
      .replace(/\*(.+?)\*/g, "$1")        // italic
      .replace(/_{1,2}(.+?)_{1,2}/g, "$1") // underscore bold/italic
      .replace(/~~(.+?)~~/g, "$1")        // strikethrough
      .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code / code blocks
      .replace(/^\s*[-*+]\s+/gm, "")     // unordered list bullets
      .replace(/^\s*\d+\.\s+/gm, "")    // ordered list numbers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → keep label
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")    // images
      .replace(/^>+\s?/gm, "")           // blockquotes
      .replace(/[-]{3,}|[*]{3,}|[_]{3,}/g, "") // horizontal rules
      .replace(/\n{2,}/g, ". ")          // blank lines → pause
      .trim();

  // ── Stream assistant reply ──────────────────────────────────────────────────
  const streamAssistantResponse = async (
    prevMsgs: Message[],
    assistantId: string
  ): Promise<string> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toAPIMessages(prevMsgs) }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to get a response from the server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let firstChunkReceived = false;
      let accumulated = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: true });
        if (chunk) {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
          if (!firstChunkReceived && chunk.trim().length > 0) {
            firstChunkReceived = true;
            setIsTyping(false);
          }
        }
      }
      return accumulated;
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: "Sorry, something went wrong." } : m))
      );
      return "";
    } finally {
      setIsTyping(false);
    }
  };

  // ── Handle file selection ───────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (IMAGE_TYPES.includes(file.type) || file.name.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i)) {
      setSelectedDocument(null);
      setSelectedImage(file);
    } else {
      setSelectedImage(null);
      setSelectedDocument(file);
    }
  };

  // ── Send message (text / image / document) ──────────────────────────────────
  const handleSend = async () => {
    const userText = input.trim();
    if (!userText && !selectedImage && !selectedDocument) return;

    // ── Image path ────────────────────────────────────────────────────────────
    if (selectedImage) {
      const imageFile = selectedImage;
      const imageUrl = URL.createObjectURL(imageFile);
      setSelectedImage(null);
      setInput("");

      let imageDescription = "";
      try {
        setIsAnalyzingImage(true);
        const form = new FormData();
        form.append("file", imageFile);
        const res = await fetch("/api/analyze-image", { method: "POST", body: form });
        if (res.ok) {
          const data = (await res.json()) as { description?: string };
          imageDescription = (data?.description || "").trim();
        } else {
          toast.error("Image analysis failed");
        }
      } catch (e) {
        console.error("Image analysis error:", e);
        toast.error("Image analysis error");
      } finally {
        setIsAnalyzingImage(false);
      }

      const contentParts: string[] = [];
      if (imageDescription) contentParts.push(`[Image content: ${imageDescription}]`);
      if (userText) contentParts.push(userText);
      const messageContent = contentParts.join("\n\n") || "[Image attached]";

      const userMessage: Message = {
        id: newId(), role: "user",
        content: userText || "(see attached image)",
        type: "image", timestamp: new Date(), imageUrl,
      };
      const assistantPlaceholder: Message = {
        id: newId(), role: "assistant", content: "", type: "text", timestamp: new Date(),
      };
      const nextMessages = [...messages, { ...userMessage, content: messageContent }];
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsTyping(true);
      streamAssistantResponse(nextMessages, assistantPlaceholder.id);
      return;
    }

    // ── Document path ─────────────────────────────────────────────────────────
    if (selectedDocument) {
      const docFile = selectedDocument;
      const docName = docFile.name;
      setSelectedDocument(null);
      setInput("");

      let extractedText = "";
      try {
        setIsExtractingDoc(true);
        const form = new FormData();
        form.append("file", docFile);
        const res = await fetch("/api/extract-document", { method: "POST", body: form });
        if (res.ok) {
          const data = (await res.json()) as { text?: string };
          extractedText = (data?.text || "").trim();
        } else {
          const err = await res.json().catch(() => ({})) as { error?: string };
          toast.error(err?.error || "Document extraction failed");
        }
      } catch (e) {
        console.error("Document extraction error:", e);
        toast.error("Document extraction error");
      } finally {
        setIsExtractingDoc(false);
      }

      if (!extractedText) return;

      const contextContent = [
        `[Attached document: ${docName}]`,
        `Document contents:\n${extractedText}`,
        userText ? `\nUser question: ${userText}` : "",
      ].filter(Boolean).join("\n\n");

      const userMessage: Message = {
        id: newId(), role: "user",
        content: userText || `Uploaded document: ${docName}`,
        type: "document", timestamp: new Date(), documentName: docName,
      };
      const assistantPlaceholder: Message = {
        id: newId(), role: "assistant", content: "", type: "text", timestamp: new Date(),
      };
      const nextMessages = [...messages, { ...userMessage, content: contextContent }];
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsTyping(true);
      streamAssistantResponse(nextMessages, assistantPlaceholder.id);
      return;
    }

    // ── Plain text path ───────────────────────────────────────────────────────
    setInput("");
    const userMessage: Message = {
      id: newId(), role: "user", content: userText, type: "text", timestamp: new Date(),
    };
    const assistantPlaceholder: Message = {
      id: newId(), role: "assistant", content: "", type: "text", timestamp: new Date(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsTyping(true);
    streamAssistantResponse(nextMessages, assistantPlaceholder.id);
  };

  // ── Recording ───────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      liveTranscriptRef.current = { final: "", interim: "" };

      // ── Live speech display via Web Speech API ──────────────────────────────
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        // Auto-stop and send after a silence window
        const triggerAutoSend = (delayMs: number) => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null;
            if (isRecordingRef.current && liveTranscriptRef.current.final.trim()) {
              try { recognitionRef.current?.stop(); } catch {}
              if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                isRecordingRef.current = false;
                setIsRecording(false);
              }
            }
          }, delayMs);
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              liveTranscriptRef.current.final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          liveTranscriptRef.current.interim = interim;
          setInput(liveTranscriptRef.current.final + interim);
          // Reset 2-second silence timer on every new speech result
          triggerAutoSend(2000);
        };
        recognition.onspeechend = () => {
          // Speech paused — send sooner if we already have final text
          if (liveTranscriptRef.current.final.trim()) triggerAutoSend(1500);
        };
        recognition.onerror = (e: any) => {
          if (e.error !== "no-speech") console.warn("SpeechRecognition error:", e.error);
        };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { /* ignore if already started */ }
      }

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Stop live speech recognition
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        // Use Web Speech API final transcript if available, else fall back to Deepgram
        const liveTranscript = liveTranscriptRef.current.final.trim();

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setInput(""); // clear live text from input field

        // Skip transcription if the recording is too short (< 1KB = likely silence)
        if (audioBlob.size < 1000 && !liveTranscript) {
          toast.error("Recording too short. Hold the button longer and speak clearly.");
          return;
        }

        (async () => {
          let transcript = liveTranscript; // prefer Web Speech API result

          // Fall back to Deepgram only if Web Speech API got nothing
          if (!transcript) {
            try {
              setIsTranscribing(true);
              const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "audio/webm" },
                body: audioBlob,
              });
              if (res.ok) {
                const data = (await res.json()) as { transcript?: string };
                transcript = (data?.transcript || "").trim();
                if (!transcript) {
                  console.warn("Deepgram returned empty transcript. Audio size:", audioBlob.size);
                }
              } else {
                const errData = await res.json().catch(() => ({})) as { error?: string; details?: string };
                console.error("Transcription failed:", errData);
                toast.error(errData?.details || errData?.error || "Transcription failed");
              }
            } catch (e) {
              console.error("Transcription error:", e);
              toast.error("Transcription error");
            } finally {
              setIsTranscribing(false);
            }
          }

          // If transcription returned nothing, don't send a confusing placeholder to the AI
          if (!transcript) {
            toast.error("No speech detected. Please speak clearly and try again.");
            return;
          }

          const userMessage: Message = {
            id: newId(), role: "user", content: transcript, type: "voice", timestamp: new Date(), audioUrl,
          };
          const assistantPlaceholder: Message = {
            id: newId(), role: "assistant", content: "", type: "text", timestamp: new Date(),
          };
          const nextMessages = [...messages, userMessage];
          setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
          setIsTyping(true);

          const finalText = await streamAssistantResponse(nextMessages, assistantPlaceholder.id);

          // TTS reply for voice input
          try {
            if (finalText?.trim()) {
              setIsSynthesizing(true);
              const ttsRes = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: stripMarkdown(finalText), voice: "alloy" }),
              });
              if (ttsRes.ok) {
                const ttsJson = (await ttsRes.json()) as { audioBase64?: string; format?: string };
                if (ttsJson?.audioBase64) {
                  const bytes = Uint8Array.from(atob(ttsJson.audioBase64), (c) => c.charCodeAt(0));
                  const blob = new Blob([bytes], { type: `audio/${ttsJson.format || "mp3"}` });
                  const url = URL.createObjectURL(blob);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantPlaceholder.id ? { ...m, type: "voice", audioUrl: url } : m
                    )
                  );
                  try { void new Audio(url).play(); } catch { /* autoplay blocked */ }
                }
              } else {
                toast.error("TTS failed");
              }
            }
          } catch (e) {
            console.error("TTS error:", e);
          } finally {
            setIsSynthesizing(false);
          }
        })();

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // collect data every 250ms to ensure chunks are captured
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    new Audio(audioUrl).play();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const clearChat = () => {
    try {
      if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    } catch {}
    setMessages([
      {
        id: "1", role: "assistant",
        content: "Hello! I'm your motorcycle leasing assistant. How can I help you today? Feel free to ask about our leasing options, pricing, available models, or any other questions you might have.",
        type: "text", timestamp: new Date(),
      },
    ]);
    setInput("");
    setSelectedImage(null);
    setSelectedDocument(null);
    setIsTyping(false);
    setIsRecording(false);
    setIsAnalyzingImage(false);
    setIsExtractingDoc(false);
    setIsTranscribing(false);
    setIsSynthesizing(false);
    toast.info("Chat cleared");
  };

  return (
    <>
      <AppHeader onClearChat={clearChat} />

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            onPlayAudio={playAudio}
            endRef={messagesEndRef}
          />
        </div>
      </ScrollArea>

      <div className="border-t bg-card p-4">
        {/* Contact a Human Agent button */}
        <div className="max-w-3xl mx-auto mb-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowContactAgentDialog(true)}
          >
            <UserRound className="h-4 w-4" />
            Contact a Human Agent
          </Button>
        </div>

        <Composer
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isTyping={isTyping}
          isRecording={isRecording}
          isAnalyzingImage={isAnalyzingImage}
          isTranscribing={isTranscribing}
          isSynthesizing={isSynthesizing}
          isExtractingDoc={isExtractingDoc}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          selectedImage={selectedImage}
          selectedDocument={selectedDocument}
          onFileSelect={handleFileSelect}
          onClearImage={() => setSelectedImage(null)}
          onClearDocument={() => setSelectedDocument(null)}
        />
      </div>

      {/* Contact Agent confirmation dialog */}
      <Dialog open={showContactAgentDialog} onOpenChange={setShowContactAgentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Contact a Human Agent
            </DialogTitle>
            <DialogDescription>
              You will be taken to a contact form where you can describe your issue.
              A member of our support team will review your inquiry and respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowContactAgentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowContactAgentDialog(false);
                router.push("/contact-agent");
              }}
            >
              Continue to Contact Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
