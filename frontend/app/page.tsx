import { MessageSquare, Shield, Zap } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ActionBtns } from "@/components/home/action-btns";

export default function HomePage() {
  //
  return (
    <div className="min-h-screen bg-background pt-14">
      <AppHeader />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              AI-Powered Motorcycle Leasing Support
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Get instant answers to your motorcycle leasing questions with our
              intelligent AI assistant, available 24/7
            </p>
          </div>

          <ActionBtns />

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Responses</h3>
              <p className="text-muted-foreground">
                Get immediate answers to your leasing questions powered by
                advanced AI
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Natural Conversations
              </h3>
              <p className="text-muted-foreground">
                Chat naturally about pricing, terms, models, and more
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Always Learning</h3>
              <p className="text-muted-foreground">
                Knowledge base continuously updated by our admin team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
