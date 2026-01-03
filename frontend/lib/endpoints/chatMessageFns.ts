import axios from "axios";
import type { Message } from "@/components/chat/types";

interface CreateChatQueueData {
  queueId: string;
  message: Message;
}

interface ChatQueueResponse {
  success: boolean;
}

export const addMessageToChatQueueFn = async (data: CreateChatQueueData) => {
  const res = await axios.post<ChatQueueResponse>("/api/chat-message", data);
  return res.data;
};
