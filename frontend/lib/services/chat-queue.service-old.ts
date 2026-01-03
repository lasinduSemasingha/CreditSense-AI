import { getServiceSupabase } from "@/lib/supabase";

export type QueueStatus = "starting" | "pending" | "active" | "resolved";
export type MessageType = "text" | "image" | "voice";
export type ChatRole = "user" | "assistant" | "agent";

export type ChatQueueMessageInput = {
  order: number;
  role: ChatRole;
  content: string;
  type: MessageType;
  imageUrl?: string;
  audioUrl?: string;
  created_at?: string; // ISO, optional when importing history
  timestamp: string; // ISO, optional when importing history
};

export async function startChatQueue(params: {
  userId: string;
  customerName: string;
  customerNumber: string;
  initialMessages: ChatQueueMessageInput[];
  initialStatus: QueueStatus;
}): Promise<{ queueId: string }> {
  const supabase = getServiceSupabase();

  // if a queue already exists for this user with status 'pending' or 'active', return that queue's id
  const { data: existingQueues, error: eErr } = await supabase
    .from("chat_queues")
    .select("id")
    .eq("user_id", params.userId)
    .in("status", ["starting", "pending", "active"])
    .limit(1);

  if (eErr) {
    throw new Error(eErr.message);
  }

  if (existingQueues && existingQueues.length > 0) {
    return { queueId: existingQueues[0].id };
  }

  // 1) create queue
  const { data: queue, error: qErr } = await supabase
    .from("chat_queues")
    .insert({
      user_id: params.userId,
      customer_name: params.customerName,
      customer_number: params.customerNumber,
      status: params.initialStatus,
      human_requested: false,
    })
    .select("id")
    .single();

  if (qErr || !queue) {
    throw new Error(qErr?.message || "Failed to create chat queue");
  }

  const queueId = queue.id as string;

  // 2) bulk insert initial messages
  const toInsert = params.initialMessages.map((m) => ({
    queue_id: queueId,
    order: m.order,
    role: m.role,
    content: m.content,
    type: m.type,
    // TODO: handle media URLs properly
    attachments: null,
    // TODO: add the date later
    // created_at: m.created_at ?? undefined,
    timestamp: m.timestamp,
  }));

  if (toInsert.length > 0) {
    const { error: mErr } = await supabase
      .from("chat_messages")
      .insert(toInsert);
    if (mErr) throw new Error(mErr.message);
  }

  // 3) update last_message_at
  await supabase
    .from("chat_queues")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", queueId);

  return { queueId };
}

export async function getChatQueueByUserId(
  userId: string,
  status?: QueueStatus
) {
  const supabase = getServiceSupabase();

  let query = supabase
    .from("chat_queues")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getChatMessagesByQueueId(queueId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("queue_id", queueId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
