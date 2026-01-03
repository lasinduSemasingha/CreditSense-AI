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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const { mutate: createChatQueue } = useCreateChatQueue();

  // Helper to generate IDs
  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  // Helper to map to API format
  const toAPIMessages = (msgs: Message[]) =>
    msgs.map((m) => ({
      role: m.role,
      content: m.content,
    }));

  // Stream assistant response from /api/chat and append chunks to the placeholder assistant message
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

      if (!res.ok || !res.body) {
        throw new Error("Failed to get a response from the server");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let firstChunkReceived = false;
      let accumulated = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        if (chunk) {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
          // Stop the typing indicator once the first non-empty chunk arrives
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
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong." }
            : m
        )
      );
      return "";
    } finally {
      // Ensure typing stops if no chunk ever arrived (e.g., error)
      setIsTyping(false);
    }
  };

  const handleSend = async (
    messageType: MessageType = "text",
    content?: string,
    imageFile?: File
  ) => {
    const messageContent = content || input;
    const imageToSend = imageFile || selectedImage || null;
    if (!messageContent.trim() && !imageToSend) return;

    // Text-only path
    const userMessage: Message = {
      id: newId(),
      role: "user",
      content: messageContent,
      type: messageType,
      timestamp: new Date(),
    };
    const assistantPlaceholder: Message = {
      id: newId(),
      role: "assistant",
      content: "",
      type: "text",
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setIsTyping(true);
    streamAssistantResponse(nextMessages, assistantPlaceholder.id);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        (async () => {
          // Transcribe with Deepgram via our API route
          let transcript = "";
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
            } else {
              console.error("Transcription failed:", await res.text());
              toast.error("Transcription failed");
            }
          } catch (e) {
            console.error("Transcription error:", e);
            toast.error("Transcription error");
          } finally {
            setIsTranscribing(false);
          }

          const content = transcript || "[Voice message]";

          const userMessage: Message = {
            id: newId(),
            role: "user",
            content,
            type: "voice",
            timestamp: new Date(),
            audioUrl,
          };

          const assistantPlaceholder: Message = {
            id: newId(),
            role: "assistant",
            content: "",
            type: "text",
            timestamp: new Date(),
          };

          const nextMessages = [...messages, userMessage];

          setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
          setIsTyping(true);

          // Stream response from API with transcribed text content
          const finalText = await streamAssistantResponse(
            nextMessages,
            assistantPlaceholder.id
          );

          // Generate TTS audio for assistant reply if this was an audio message
          try {
            if (finalText && finalText.trim().length > 0) {
              setIsSynthesizing(true);
              const ttsRes = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: finalText,
                  voice: "alloy",
                  format: "mp3",
                }),
              });
              if (ttsRes.ok) {
                const ttsJson = (await ttsRes.json()) as {
                  audioBase64?: string;
                  format?: string;
                };
                if (ttsJson?.audioBase64) {
                  const bytes = Uint8Array.from(
                    atob(ttsJson.audioBase64),
                    (c) => c.charCodeAt(0)
                  );
                  const blob = new Blob([bytes], {
                    type: `audio/${ttsJson.format || "mp3"}`,
                  });
                  const url = URL.createObjectURL(blob);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantPlaceholder.id
                        ? { ...m, type: "voice", audioUrl: url }
                        : m
                    )
                  );
                  // Auto-play the assistant's TTS reply once ready
                  try {
                    const audio = new Audio(url);
                    void audio.play();
                  } catch (err) {
                    // Autoplay might be blocked by the browser; user can tap to play.
                    console.warn("Autoplay failed; awaiting user interaction.");
                  }
                }
              } else {
                console.error("TTS failed:", await ttsRes.text());
                toast.error("TTS failed");
              }
            }
          } catch (e) {
            console.error("TTS error:", e);
            toast.error("TTS error");
          } finally {
            setIsSynthesizing(false);
          }
        })();

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const clearChat = () => {
    // Stop any active recording
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    } catch {}

    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm your motorcycle leasing assistant. How can I help you today? Feel free to ask about our leasing options, pricing, available models, or any other questions you might have.",
        type: "text",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setSelectedImage(null);
    setIsTyping(false);
    setIsRecording(false);
    setIsAnalyzingImage(false);
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
        <Composer
          input={input}
          onInputChange={setInput}
          onSend={() => handleSend()}
          isTyping={isTyping}
          isRecording={isRecording}
          isAnalyzingImage={isAnalyzingImage}
          isTranscribing={isTranscribing}
          isSynthesizing={isSynthesizing}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          hasSelectedImage={!!selectedImage}
        />
      </div>
    </>
  );
}
