"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { authClient } from "@/utils/auth-client";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    customerNumber: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await authClient.signUp.email(
        {
          email: formData.email, // user email
          password: formData.password, // user password
          name: formData.name, // user name
          customerNumber: formData.customerNumber, // additional field
          callbackURL: "/", // A URL to redirect to after the user verifies their email (optional)
        },
        {
          onRequest: (ctx) => {
            // toast.loading("Creating account...");
          },
          onSuccess: (ctx) => {
            toast.success("Verification email sent. Please check your inbox.");
            setFormData({
              name: "",
              email: "",
              password: "",
              confirmPassword: "",
              customerNumber: "",
            });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        }
      );

      // const result = await register(
      //   formData.email,
      //   formData.password,
      //   formData.name,
      //   formData.customerNumber
      // );

      // if (result.success) {
      //   router.push("/chat");
      // } else {
      //   setError(result.error || "Registration failed");
      // }
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup.");
      toast.error(err.message || "An error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Register with your customer number to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-accent/50 border border-accent">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
                <p className="text-accent-foreground">
                  You must have a valid customer number provided by the leasing
                  company to register.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNumber">Customer Number</Label>
              <Input
                id="customerNumber"
                type="text"
                placeholder="e.g., ML-2024-001"
                value={formData.customerNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
            <div className="text-sm text-center">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground"
              >
                Back to Home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
