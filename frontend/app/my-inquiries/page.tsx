"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PermissionGuard } from "@/components/permission-guard";
import { useMyInquiries } from "@/hooks/use-contact-inquiries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MessageCircle, PlusCircle, ChevronRight } from "lucide-react";
import type { InquiryStatus } from "@/lib/services/contact-inquiry.service";

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MyInquiriesList() {
  const { data: inquiries, isLoading, isError } = useMyInquiries();

  return (
    <div className="min-h-screen bg-background pt-14">
      <AppHeader />
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Inquiries</h1>
              <p className="text-sm text-muted-foreground">
                Track your support requests and agent responses.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/contact-agent">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Inquiry
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-6 text-center text-sm text-destructive">
              Failed to load inquiries. Please refresh the page.
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && inquiries?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No inquiries yet</p>
                <p className="text-sm text-muted-foreground">
                  Submit an inquiry and a human agent will assist you.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/contact-agent">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Contact an Agent
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && inquiries && inquiries.length > 0 && (
          <div className="space-y-3">
            {inquiries.map((inquiry) => {
              const cfg = STATUS_CONFIG[inquiry.status] ?? STATUS_CONFIG.open;
              return (
                <Link key={inquiry.id} href={`/my-inquiries/${inquiry.id}`}>
                  <Card className="cursor-pointer transition-colors hover:bg-accent/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-snug">
                          {inquiry.subject}
                        </CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm">
                        {inquiry.message}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(inquiry.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyInquiriesPage() {
  return (
    <PermissionGuard role="user">
      <MyInquiriesList />
    </PermissionGuard>
  );
}
