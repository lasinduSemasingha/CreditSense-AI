"use client";

import { Badge } from "@/components/ui/badge";
import { QueueStatus } from "@/lib/services/chat-queue.service";
import { UserPlus } from "lucide-react";

type HumanAgentBannerProps = {
  show: boolean;
  status?: QueueStatus;
};

export function HumanAgentBanner({ show, status }: HumanAgentBannerProps) {
  if (!show) return null;
  return (
    <div className="bg-accent/20 border border-accent rounded-lg p-4 flex items-center gap-3">
      <UserPlus className="h-5 w-5 text-accent" />
      <div className="flex-1">
        <p className="font-medium text-sm">Connected to Human Agent</p>
        {status === "pending" && (
          <p className="text-xs text-muted-foreground">
            A team member will respond shortly
          </p>
        )}
        {status === "active" && (
          <p className="text-xs text-muted-foreground">
            You are now chatting with a human agent
          </p>
        )}
        {status === "resolved" && (
          <p className="text-xs text-muted-foreground">
            This chat has been resolved
          </p>
        )}
      </div>
      {status === "pending" && (
        <Badge className="text-yellow-500 bg-yellow-100">Pending</Badge>
      )}
      {status === "active" && (
        <Badge className="text-green-500 bg-green-100">Active</Badge>
      )}
      {status === "resolved" && (
        <Badge className="text-gray-500 bg-gray-100">Resolved</Badge>
      )}
    </div>
  );
}
