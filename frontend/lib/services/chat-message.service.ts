import { Message } from "@/components/chat/types";
import { getServiceSupabase } from "@/lib/supabase";
import { ChatRole } from "./chat-queue.service";

// Add a message to a chat queue
export async function addMessageToChatQueue(params: {
  queueId: string;
  message: Message;
}): Promise<void> {
  const supabase = getServiceSupabase();

  // Find next order for this queue
  const { data: lastRows, error: fetchError } = await supabase
    .from("chat_messages")
    .select("order")
    .eq("queue_id", params.queueId)
    .order("order", { ascending: false })
    .limit(1);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const nextOrder = ((lastRows && lastRows[0]?.order) ?? 0) + 1;

  // Transform Message to DB row and include incremented order
  const messageInput = {
    role: params.message.role as ChatRole,
    content: params.message.content,
    type: params.message.type,
    timestamp: params.message.timestamp,
    order: nextOrder,
  };

  const { error } = await supabase.from("chat_messages").insert({
    queue_id: params.queueId,
    ...messageInput,
  });

  if (error) {
    throw new Error(error.message);
  }
}
