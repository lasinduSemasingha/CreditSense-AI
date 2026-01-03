import axios from "axios";
import type { Message, MessageType } from "@/components/chat/types";
import { ChatRole, QueueStatus } from "../services/chat-queue.service";

interface CreateChatQueueData {
  history: Message[];
}

interface ChatQueueResponse {
  queueId: string;
}

// create chat queue
export const createChatQueueFn = async (data: CreateChatQueueData) => {
  const res = await axios.post<ChatQueueResponse>("/api/chat-queue", data);
  return res.data;
};

// {"json":{"id":23,"messages":[{"id":54,"role":"assistant","type":"text","order":0,"content":"Hello! I'm your motorcycle leasing assistant. How can I help you today? Feel free to ask about our leasing options, pricing, available models, or any other questions you might have.","queue_id":23,"timestamp":"2025-10-30T17:27:08.262+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":55,"role":"user","type":"text","order":1,"content":"hi","queue_id":23,"timestamp":"2025-10-30T17:27:11.189+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":56,"role":"assistant","type":"text","order":2,"content":"Hi there! How can I assist you with motorcycle leasing today?","queue_id":23,"timestamp":"2025-10-30T17:27:11.189+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":57,"role":"user","type":"text","order":3,"content":"ok","queue_id":23,"timestamp":"2025-10-30T17:27:17.376+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":58,"role":"assistant","type":"text","order":4,"content":"If you have any specific questions about motorcycle leasing, feel free to let me know! I'm here to help.","queue_id":23,"timestamp":"2025-10-30T17:27:17.376+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":59,"role":"user","type":"voice","order":5,"content":"hello how are you","queue_id":23,"timestamp":"2025-10-30T17:27:25.319+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":60,"role":"assistant","type":"voice","order":6,"content":"Hello! I'm doing well, thank you! How can I assist you with motorcycle leasing today?","queue_id":23,"timestamp":"2025-10-30T17:27:25.319+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":61,"role":"user","type":"image","order":7,"content":"what this?","queue_id":23,"timestamp":"2025-10-30T17:27:38.383+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null},{"id":62,"role":"assistant","type":"text","order":8,"content":"Sorry, I don't know how to help with that. If you have any questions about motorcycle leasing, feel free to ask!","queue_id":23,"timestamp":"2025-10-30T17:27:38.383+00:00","created_at":"2025-10-30T17:28:39.572846+00:00","attachments":null}]}}
interface GetChatQueueResponse {
  id: string;
  user_id: string;
  customer_name: string;
  customer_number: string;
  status: QueueStatus;
  messages: Message[];
}

// get chat queue by id
export const getChatQueueByIdFn = async (id: string) => {
  const res = await axios.get<GetChatQueueResponse>(`/api/chat-queue/${id}`);
  return res.data;
};

// get all chat queues by status
export const getChatQueuesByStatusFn = async (status: QueueStatus) => {
  const res = await axios.get<GetChatQueueResponse[]>(
    `/api/chat-queue?status=${status}`
  );
  return res.data;
};

export const updateChatQueueStatusFn = async (data: {
  queueId: string;
  status: QueueStatus;
}) => {
  const res = await axios.patch("/api/chat-queue", {
    queueId: data.queueId,
    status: data.status,
  });
  return res.data;
};
