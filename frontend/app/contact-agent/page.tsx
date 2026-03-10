"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PermissionGuard } from "@/components/permission-guard";
import { useCreateContactInquiry } from "@/hooks/use-contact-inquiries";
import { authClient } from "@/utils/auth-client";
import { toast } from "sonner";
import { Loader2, Send, MessageCircle } from "lucide-react";

function ContactAgentForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { mutate: createInquiry, isPending } = useCreateContactInquiry();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Pre-fill with session data
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const customerNumber =
    (session?.user as Record<string, unknown> | undefined)?.customerNumber as string | undefined ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    createInquiry(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: (inquiry) => {
          toast.success("Your inquiry has been submitted! An agent will respond shortly.");
          router.push(`/my-inquiries/${inquiry.id}`);
        },
        onError: () => {
          toast.error("Failed to submit inquiry. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <AppHeader />
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contact a Human Agent</h1>
            <p className="text-sm text-muted-foreground">
              Fill out the form below and an agent will respond to your inquiry.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-lg">New Inquiry</CardTitle>
              <CardDescription>
                Describe your issue or question and our support team will get back to you.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Read-only customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Your Name</Label>
                  <Input value={userName} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={userEmail} readOnly className="bg-muted/50" />
                </div>
              </div>

              {customerNumber && (
                <div className="space-y-1.5">
                  <Label>Customer Number</Label>
                  <Input value={customerNumber} readOnly className="bg-muted/50" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g. Issue with my leasing application"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isPending}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Describe your question or issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isPending}
                  rows={6}
                  maxLength={3000}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/3000
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !subject.trim() || !message.trim()}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function ContactAgentPage() {
  return (
    <PermissionGuard role="user">
      <ContactAgentForm />
    </PermissionGuard>
  );
}
