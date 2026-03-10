import { getServiceSupabase } from "@/lib/supabase";

export type InquiryStatus = "open" | "in_progress" | "resolved";

export interface InquiryReply {
  id: number;
  created_at: string;
  inquiry_id: number;
  sender_role: "user" | "admin";
  sender_name: string;
  content: string;
}

export interface ContactInquiry {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_number: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  replies?: InquiryReply[];
}

export async function createContactInquiry(data: {
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_number: string | null;
  subject: string;
  message: string;
}): Promise<ContactInquiry> {
  const supabase = getServiceSupabase();
  const { data: inquiry, error } = await supabase
    .from("contact_inquiries")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return inquiry as ContactInquiry;
}

export async function getContactInquiryById(
  id: string | number
): Promise<ContactInquiry | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*, replies:inquiry_replies(*)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  if (data.replies) {
    data.replies.sort(
      (a: InquiryReply, b: InquiryReply) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  return data as ContactInquiry;
}

export async function getContactInquiriesByUserId(
  userId: string
): Promise<ContactInquiry[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ContactInquiry[];
}

export async function getAllContactInquiries(
  status?: InquiryStatus
): Promise<ContactInquiry[]> {
  const supabase = getServiceSupabase();
  let query = supabase
    .from("contact_inquiries")
    .select("*")
    .order("updated_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ContactInquiry[];
}

export async function updateInquiryStatus(
  id: string | number,
  status: InquiryStatus
): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("contact_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function addInquiryReply(data: {
  inquiry_id: number;
  sender_role: "user" | "admin";
  sender_name: string;
  content: string;
}): Promise<InquiryReply> {
  const supabase = getServiceSupabase();

  // When admin replies, set inquiry to in_progress if it was open
  if (data.sender_role === "admin") {
    await supabase
      .from("contact_inquiries")
      .update({ updated_at: new Date().toISOString(), status: "in_progress" })
      .eq("id", data.inquiry_id)
      .eq("status", "open");
    // Always update updated_at even if not open
    await supabase
      .from("contact_inquiries")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.inquiry_id);
  } else {
    await supabase
      .from("contact_inquiries")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.inquiry_id);
  }

  const { data: reply, error } = await supabase
    .from("inquiry_replies")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return reply as InquiryReply;
}
