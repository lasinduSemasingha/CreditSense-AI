"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBaseManager } from "@/components/knowledge-base-manager";
import { AppHeader } from "@/components/app-header";
import { Database, MessageSquare } from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

export default function AdminPage() {
  return (
    <PermissionGuard role="admin">
      <div className="min-h-screen bg-background pt-14">
        <AppHeader />
        <div className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="chats" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chats" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Live Chats
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Live Chat Management
                </h2>
                <p className="text-muted-foreground">
                  Manage customer chats that require human assistance
                </p>
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Knowledge Base
                </h2>
                <p className="text-muted-foreground">
                  Manage AI assistant knowledge and training data
                </p>
              </div>
              <KnowledgeBaseManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGuard>
  );
}
