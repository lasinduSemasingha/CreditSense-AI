"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBaseManager } from "@/components/knowledge-base-manager";
import { AdminInquiryPanel } from "@/components/contact-inquiry/AdminInquiryPanel";
import { AppHeader } from "@/components/app-header";
import { Database, MessageSquare, Inbox } from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

export default function AdminPage() {
  return (
    <PermissionGuard role="admin">
      <div className="min-h-screen bg-background pt-14">
        <AppHeader />
        <div className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="inquiries" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="chats" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Live Chats
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Inquiries
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

            <TabsContent value="inquiries" className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Customer Inquiries
                </h2>
                <p className="text-muted-foreground">
                  Review and respond to customer support inquiries. Auto-refreshes every 5 seconds.
                </p>
              </div>
              <AdminInquiryPanel />
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
