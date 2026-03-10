import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createContactInquiryFn,
  getMyInquiriesFn,
  getAllInquiriesFn,
  getContactInquiryByIdFn,
  updateInquiryStatusFn,
  addInquiryReplyFn,
} from "@/lib/endpoints/contactInquiryFns";
import type { InquiryStatus } from "@/lib/services/contact-inquiry.service";

export const useCreateContactInquiry = () =>
  useMutation({
    mutationFn: createContactInquiryFn,
    mutationKey: ["create-contact-inquiry"],
  });

export const useMyInquiries = () =>
  useQuery({
    queryKey: ["my-inquiries"],
    queryFn: getMyInquiriesFn,
    refetchInterval: 10000,
  });

export const useAllInquiries = (status?: InquiryStatus) =>
  useQuery({
    queryKey: ["all-inquiries", status],
    queryFn: () => getAllInquiriesFn(status),
    refetchInterval: 5000,
  });

export const useContactInquiryById = (id: string) =>
  useQuery({
    queryKey: ["contact-inquiry", id],
    queryFn: () => getContactInquiryByIdFn(id),
    enabled: !!id,
    refetchInterval: 5000,
  });

export const useUpdateInquiryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInquiryStatusFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-inquiry", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["all-inquiries"] });
    },
  });
};

export const useAddInquiryReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addInquiryReplyFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-inquiry", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["my-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["all-inquiries"] });
    },
  });
};
