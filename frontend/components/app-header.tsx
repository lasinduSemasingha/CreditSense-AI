"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Home, LogOut, LogIn, RotateCcw, BarChart3, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { authClient } from "@/utils/auth-client";
import { usePermissions } from "./permission-guard";

type AppHeaderProps = {
  onClearChat?: () => void;
};

export function AppHeader({ onClearChat }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole } = usePermissions();

  const { data: session } = authClient.useSession();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore sign out errors; still redirect
    }
    router.push("/login");
  };

  const handleChatClick = () => {
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
    <header className="fixed top-0 left-0 right-0 w-full border-b bg-card/50 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">
              MotoLease AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "transition-colors",
                isActive("/") && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-colors",
                isActive("/chat") && "bg-accent text-accent-foreground"
              )}
              onClick={handleChatClick}
              disabled={!!session && userRole !== "user"}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-colors",
                isActive("/admin") && "bg-accent text-accent-foreground"
              )}
              onClick={handleAdminClick}
              disabled={!!session && userRole !== "admin"}
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "transition-colors",
                isActive("/branch-performance") && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/branch-performance">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "transition-colors",
                isActive("/credit-risk") && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/credit-risk">
                <TrendingUp className="mr-2 h-4 w-4" />
                Credit Risk
              </Link>
            </Button>
            {session?.user && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "transition-colors",
                  isActive("/predict") && "bg-accent text-accent-foreground"
                )}
              >
                <Link href="/predict">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Impairments
                </Link>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Clear chat on chat page when handler provided */}
          {typeof onClearChat === "function" && pathname === "/chat" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearChat}
              title="Clear chat and start over"
              aria-label="Clear chat and start over"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}

          {/* Desktop: show text button on md+ only */}
          {session?.user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:inline-flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:inline-flex"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          {/* Mobile navigation */}
          <div className="flex md:hidden items-center gap-1">
            {!isActive("/") && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
            )}
            {!isActive("/chat") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleChatClick}
                disabled={!!session && userRole !== "user"}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}
            {!isActive("/admin") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAdminClick}
                disabled={!!session && userRole !== "admin"}
              >
                <Shield className="h-5 w-5" />
              </Button>
            )}
            {!isActive("/branch-performance") && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/branch-performance">
                  <BarChart3 className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {session?.user && !isActive("/predict") && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/predict">
                  <BarChart2 className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Mobile: sign in / sign out as icon, placed at the end */}
            {session?.user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild aria-label="Sign in">
                <Link href="/login">
                  <LogIn className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
