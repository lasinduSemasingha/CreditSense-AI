import { useQuery, useMutation } from "@tanstack/react-query";
import {
  createChatQueueFn,
  getChatQueueByIdFn,
  getChatQueuesByStatusFn,
  updateChatQueueStatusFn,
} from "@/lib/endpoints/chatQueueFns";
import { QueueStatus } from "@/lib/services/chat-queue.service";

export const useCreateChatQueue = () => {
  return useMutation({
    mutationFn: createChatQueueFn,
    mutationKey: ["create-chat-queue"],
  });
};

export const useChatQueueById = (id: string) => {
  return useQuery({
    queryKey: ["chat-queue", id],
    queryFn: () => getChatQueueByIdFn(id),
    enabled: !!id,
    // periodic refetching to keep data fresh
    refetchInterval: 5000,
  });
};

export const useChatQueuesByStatus = (status: QueueStatus) => {
  return useQuery({
    queryKey: ["chat-queues", status],
    queryFn: () => getChatQueuesByStatusFn(status),
    enabled: !!status,
    refetchInterval: 5000,
  });
};

export const useUpdateChatQueueStatus = () => {
  return useMutation({
    mutationFn: updateChatQueueStatusFn,
    mutationKey: ["update-chat-queue-status"],
  });
};
