export type MessageType = "text" | "image" | "voice" | "image-analysis" | "document";

export type Message = {
  id: string;
  role: "user" | "assistant" | "agent";
  content: string;
  type: MessageType;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
  documentName?: string;
};
