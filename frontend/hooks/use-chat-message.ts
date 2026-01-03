import { useQuery, useMutation } from "@tanstack/react-query";
import { addMessageToChatQueueFn } from "@/lib/endpoints/chatMessageFns";

export const useAddMessageToChatQueue = () => {
  return useMutation({
    mutationFn: addMessageToChatQueueFn,
    mutationKey: ["add-message-to-chat-queue"],
  });
};
