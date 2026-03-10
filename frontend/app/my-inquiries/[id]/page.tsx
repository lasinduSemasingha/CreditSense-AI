"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PermissionGuard } from "@/components/permission-guard";
import { useContactInquiryById, useAddInquiryReply } from "@/hooks/use-contact-inquiries";
import { authClient } from "@/utils/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, ArrowLeft, User, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { InquiryStatus } from "@/lib/services/contact-inquiry.service";
import { cn } from "@/lib/utils";

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

function InquiryThreadView() {
  const params = useParams();
  const id = params.id as string;

  const { data: session } = authClient.useSession();
  const { data: inquiry, isLoading, isError } = useContactInquiryById(id);
  const { mutate: addReply, isPending: isSending } = useAddInquiryReply();

  const [replyContent, setReplyContent] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inquiry?.replies]);

  const handleSendReply = () => {
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    addReply(
      { id, content: trimmed },
      {
        onSuccess: () => setReplyContent(""),
        onError: () => toast.error("Failed to send reply. Please try again."),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <AppHeader />
        <div className="flex justify-center pt-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError || !inquiry) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-6 text-center">
          <p className="text-destructive">Inquiry not found or failed to load.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/my-inquiries">Back to inquiries</Link>
          </Button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[inquiry.status] ?? STATUS_CONFIG.open;
  const isResolved = inquiry.status === "resolved";

  return (
    <div className="min-h-screen bg-background pt-14 flex flex-col">
      <AppHeader />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/my-inquiries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold leading-tight truncate">
                {inquiry.subject}
              </h1>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {formatDate(inquiry.created_at)} · #{inquiry.id}
            </p>
          </div>
        </div>

        {/* Thread */}
        <ScrollArea className="flex-1 rounded-lg border bg-card min-h-[300px] max-h-[60vh]">
          <div className="p-4 space-y-4">
            {/* Original inquiry as first message */}
            <div className="flex gap-3 justify-end">
              <div className="max-w-[80%] space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(inquiry.created_at)}
                  </span>
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
                  <div className={cn("max-w-[80%] space-y-1", isFromUser && "items-end flex flex-col")}>
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
                        <Badge variant="outline" className="text-[10px] py-0 h-4 text-green-600 border-green-400">
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
              <div className="flex justify-center">
                <Badge variant="outline" className="text-muted-foreground">
                  This inquiry has been resolved
                </Badge>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Reply composer */}
        {!isResolved && (
          <div className="flex gap-2 items-end">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
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
    </div>
  );
}

export default function InquiryThreadPage() {
  return (
    <PermissionGuard role="user">
      <InquiryThreadView />
    </PermissionGuard>
  );
}
