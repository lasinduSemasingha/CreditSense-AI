import axios from "axios";
import type {
  ContactInquiry,
  InquiryReply,
  InquiryStatus,
} from "@/lib/services/contact-inquiry.service";

export interface CreateInquiryData {
  subject: string;
  message: string;
}

export const createContactInquiryFn = async (
  data: CreateInquiryData
): Promise<ContactInquiry> => {
  const res = await axios.post<ContactInquiry>("/api/contact-inquiry", data);
  return res.data;
};

export const getMyInquiriesFn = async (): Promise<ContactInquiry[]> => {
  const res = await axios.get<ContactInquiry[]>("/api/contact-inquiry");
  return res.data;
};

export const getAllInquiriesFn = async (
  status?: InquiryStatus
): Promise<ContactInquiry[]> => {
  const url = status
    ? `/api/contact-inquiry?status=${status}`
    : "/api/contact-inquiry";
  const res = await axios.get<ContactInquiry[]>(url);
  return res.data;
};

export const getContactInquiryByIdFn = async (
  id: string
): Promise<ContactInquiry> => {
  const res = await axios.get<ContactInquiry>(`/api/contact-inquiry/${id}`);
  return res.data;
};

export const updateInquiryStatusFn = async (data: {
  id: string;
  status: InquiryStatus;
}): Promise<void> => {
  await axios.patch(`/api/contact-inquiry/${data.id}`, {
    status: data.status,
  });
};

export const addInquiryReplyFn = async (data: {
  id: string;
  content: string;
}): Promise<InquiryReply> => {
  const res = await axios.post<InquiryReply>(
    `/api/contact-inquiry/${data.id}/reply`,
    { content: data.content }
  );
  return res.data;
};
