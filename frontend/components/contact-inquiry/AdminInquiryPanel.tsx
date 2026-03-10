"use client";

import { useState, useRef, useEffect } from "react";
import {
  useAllInquiries,
  useContactInquiryById,
  useAddInquiryReply,
  useUpdateInquiryStatus,
} from "@/hooks/use-contact-inquiries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Send,
  ArrowLeft,
  User,
  Shield,
  MessageCircle,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InquiryStatus, ContactInquiry } from "@/lib/services/contact-inquiry.service";

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Inquiry detail / thread (admin side)                                  */
/* ------------------------------------------------------------------ */
function InquiryDetail({
  inquiryId,
  onBack,
}: {
  inquiryId: string;
  onBack: () => void;
}) {
  const { data: inquiry, isLoading } = useContactInquiryById(inquiryId);
  const { mutate: addReply, isPending: isSending } = useAddInquiryReply();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateInquiryStatus();

  const [replyContent, setReplyContent] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inquiry?.replies]);

  const handleSendReply = () => {
    const trimmed = replyContent.trim();
    if (!trimmed || !inquiry) return;
    addReply(
      { id: String(inquiry.id), content: trimmed },
      {
        onSuccess: () => setReplyContent(""),
        onError: () => toast.error("Failed to send reply."),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleStatusChange = (status: InquiryStatus) => {
    if (!inquiry) return;
    updateStatus(
      { id: String(inquiry.id), status },
      {
        onSuccess: () => toast.success(`Status updated to ${STATUS_CONFIG[status].label}`),
        onError: () => toast.error("Failed to update status."),
      }
    );
  };

  if (isLoading || !inquiry) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cfg = STATUS_CONFIG[inquiry.status] ?? STATUS_CONFIG.open;
  const isResolved = inquiry.status === "resolved";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-0.5">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base leading-snug truncate">{inquiry.subject}</h3>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            From: <span className="font-medium">{inquiry.customer_name}</span> ({inquiry.customer_email})
            {inquiry.customer_number && ` · #${inquiry.customer_number}`}
            {" · "}Submitted {formatDate(inquiry.created_at)}
          </p>
        </div>

        {/* Status selector */}
        <Select
          value={inquiry.status}
          onValueChange={(v) => handleStatusChange(v as InquiryStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Thread */}
      <ScrollArea className="flex-1 rounded-lg border bg-card min-h-[280px] max-h-[50vh]">
        <div className="p-4 space-y-4">
          {/* Original message */}
          <div className="flex gap-3 justify-end">
            <div className="max-w-[80%] space-y-1">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(inquiry.created_at)}</span>
                <span className="text-xs font-medium">{inquiry.customer_name}</span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3 w-3 text-primary" />
                </div>
              </div>
              <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground text-sm">
                {inquiry.message}
              </div>
            </div>
          </div>

          {/* Replies */}
          {inquiry.replies?.map((reply) => {
            const isFromUser = reply.sender_role === "user";
            return (
              <div
                key={reply.id}
                className={cn("flex gap-3", isFromUser ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] space-y-1",
                    isFromUser && "items-end flex flex-col"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isFromUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isFromUser && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                        <Shield className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                    <span className="text-xs font-medium">{reply.sender_name}</span>
                    {!isFromUser && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 h-4 text-green-600 border-green-400"
                      >
                        Agent
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(reply.created_at)}
                    </span>
                    {isFromUser && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm",
                      isFromUser
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted text-foreground"
                    )}
                  >
                    {reply.content}
                  </div>
                </div>
              </div>
            );
          })}

          {isResolved && (
            <div className="flex justify-center pt-2">
              <Badge variant="outline" className="text-muted-foreground">
                Inquiry resolved
              </Badge>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply composer (admin) */}
      {!isResolved && (
        <div className="flex gap-2 items-end">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply to the customer… (Enter to send)"
            className="resize-none flex-1"
            rows={3}
            disabled={isSending}
          />
          <Button
            onClick={handleSendReply}
            disabled={isSending || !replyContent.trim()}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inquiry list row                                                       */
/* ------------------------------------------------------------------ */
function InquiryRow({
  inquiry,
  onClick,
}: {
  inquiry: ContactInquiry;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[inquiry.status] ?? STATUS_CONFIG.open;
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/40"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-snug truncate">
              {inquiry.subject}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {inquiry.customer_name} · {inquiry.customer_email}
              {inquiry.customer_number && ` · #${inquiry.customer_number}`}
            </CardDescription>
          </div>
          <Badge variant={cfg.variant} className="shrink-0">
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="text-xs text-muted-foreground line-clamp-1">{inquiry.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Updated {formatDate(inquiry.updated_at)}
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main AdminInquiryPanel                                                */
/* ------------------------------------------------------------------ */
export function AdminInquiryPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | undefined>(undefined);

  const { data: inquiries, isLoading } = useAllInquiries(statusFilter);

  if (selectedId) {
    return (
      <InquiryDetail
        inquiryId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <Tabs
        value={statusFilter ?? "all"}
        onValueChange={(v) =>
          setStatusFilter(v === "all" ? undefined : (v as InquiryStatus))
        }
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && inquiries?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium">No inquiries</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter
                  ? `No ${STATUS_CONFIG[statusFilter].label.toLowerCase()} inquiries at the moment.`
                  : "No customer inquiries yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && inquiries && inquiries.length > 0 && (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <InquiryRow
              key={inquiry.id}
              inquiry={inquiry}
              onClick={() => setSelectedId(String(inquiry.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
