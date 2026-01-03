export type MessageType = "text" | "image" | "voice" | "image-analysis";

export type Message = {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  type: MessageType;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
};
