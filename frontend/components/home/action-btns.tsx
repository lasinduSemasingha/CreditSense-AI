"use client";

import { Button } from "../ui/button";
import { MessageSquare, Shield } from "lucide-react";
import { usePermissions } from "../permission-guard";
import { useRouter } from "next/navigation";
import { authClient } from "@/utils/auth-client";

export function ActionBtns() {
  const router = useRouter();
  const { userRole } = usePermissions();
  const { data: session } = authClient.useSession();
  //
  const handleChatClick = () => {
    console.log("Chat button clicked");
    console.log("User role:", userRole);
    if (userRole === "user") {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  const handleAdminClick = () => {
    if (userRole === "admin") {
      router.push("/admin");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Button
        size="lg"
        className="text-lg px-8"
        onClick={handleChatClick}
        disabled={!!session && userRole !== "user"}
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Start Chat
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="text-lg px-8 bg-transparent"
        onClick={handleAdminClick}
        disabled={!!session && userRole !== "admin"}
      >
        <Shield className="mr-2 h-5 w-5" />
        Admin Portal
      </Button>
    </div>
  );
}
