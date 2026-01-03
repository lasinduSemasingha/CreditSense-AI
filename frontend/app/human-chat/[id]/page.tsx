"use client";

import HumanChatInterface from "@/components/human-chat-interface";
import { PermissionGuard } from "@/components/permission-guard";
import { useParams } from "next/navigation";

export default function HumanChatPage() {
  const { id } = useParams<{ id: string }>();
  //
  return (
    <PermissionGuard role="user">
      <div className="h-screen flex flex-col pt-14">
        <HumanChatInterface humanChatId={id} />
      </div>
    </PermissionGuard>
  );
}
