import { ChatInterface } from "@/components/chat-interface";
import { PermissionGuard } from "@/components/permission-guard";

export default function ChatPage() {
  return (
    <PermissionGuard role="user">
      <div className="h-screen flex flex-col pt-14">
        <ChatInterface />
      </div>
    </PermissionGuard>
  );
}
