import { Message, MessageType } from "@/components/chat/types";
import { getServiceSupabase } from "@/lib/supabase";

export type ChatQueueMessageInput = {
  order: number;
  role: ChatRole;
  content: string;
  type: MessageType;
  timestamp: string;
};
export type ChatRole = "user" | "assistant" | "agent";
export type QueueStatus = "pending" | "active" | "resolved";

export async function startChatQueue(params: {
  userId: string;
  customerName: string;
  customerNumber: string;
  history: Message[];
}): Promise<{ queueId: string }> {
  const supabase = getServiceSupabase();

  // Transform Message[] to ChatQueueMessageInput[]
  const initialMessages = params.history.map((msg, index) => ({
    order: index,
    role: msg.role as ChatRole,
    content: msg.content,
    type: msg.type,
    // timestamp: msg.timestamp.toISOString(),
    timestamp: msg.timestamp,
  }));

  // 1) create queue
  const { data: queue, error: qErr } = await supabase
    .from("chat_queues")
    .insert({
      user_id: params.userId,
      customer_name: params.customerName,
      customer_number: params.customerNumber,
      status: "pending",
      human_requested: true,
    })
    .select("id")
    .single();

  if (qErr || !queue) {
    throw new Error(qErr?.message || "Failed to create chat queue");
  }

  const queueId = queue.id as string;

  // 2) bulk insert initial messages
  const toInsert = initialMessages.map((m) => ({
    queue_id: queueId,
    order: m.order,
    role: m.role,
    content: m.content,
    type: m.type,
    timestamp: m.timestamp,
  }));

  if (toInsert.length > 0) {
    const { error: mErr } = await supabase
      .from("chat_messages")
      .insert(toInsert);
    if (mErr) throw new Error(mErr.message);
  }

  return { queueId };
}

// get chat queue by id populated with messages
export async function getChatQueueById(queueId: string): Promise<{
  id: string;
  user_id: string;
  customer_name: string;
  customer_number: string;
  status: QueueStatus;
  messages: Message[];
}> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("chat_queues")
    // .select("id, status, messages:chat_messages(*)")
    .select(
      "*, messages:chat_messages(id, role, type, order, content, timestamp)"
    )
    .eq("id", queueId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to retrieve chat queue");
  }

  return {
    id: data.id,
    user_id: data.user_id,
    customer_name: data.customer_name,
    customer_number: data.customer_number,
    status: data.status,
    messages: data.messages,
  };
}

// get all chat queues filtered by status
export async function getChatQueuesByStatus(status: QueueStatus): Promise<
  {
    id: string;
    user_id: string;
    customer_name: string;
    customer_number: string;
    status: QueueStatus;
    messages: Message[];
  }[]
> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("chat_queues")
    .select(
      "*, messages:chat_messages(id, role, type, order, content, timestamp)"
    )
    .eq("status", status);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((item) => ({
    id: item.id,
    user_id: item.user_id,
    customer_name: item.customer_name,
    customer_number: item.customer_number,
    status: item.status,
    messages: item.messages,
  }));
}

// change status of chat queue
export async function updateChatQueueStatus(
  queueId: string,
  status: QueueStatus
): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("chat_queues")
    .update({ status })
    .eq("id", queueId);

  if (error) {
    throw new Error(error.message);
  }
}
