"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

type HumanAgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function HumanAgentDialog({ open, onOpenChange, onConfirm }: HumanAgentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Human Agent</DialogTitle>
          <DialogDescription>
            Would you like to connect with a human agent? Your conversation history will be transferred to our support team.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <UserPlus className="h-4 w-4 mr-2" />
            Connect to Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
