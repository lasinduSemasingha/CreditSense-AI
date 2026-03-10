import { NextResponse } from "next/server";
import { withRole } from "@/utils/server-permissions";
import type { RequestWithSession } from "@/utils/server-permissions";
import {
  createContactInquiry,
  getAllContactInquiries,
  getContactInquiriesByUserId,
} from "@/lib/services/contact-inquiry.service";
import type { InquiryStatus } from "@/lib/services/contact-inquiry.service";

// POST /api/contact-inquiry — create a new inquiry (authenticated users)
export const POST = withRole(
  ["user", "admin"],
  async (req: RequestWithSession) => {
    try {
      const body = (await req.json()) as { subject?: string; message?: string };
      const { subject, message } = body;

      if (!subject?.trim() || !message?.trim()) {
        return NextResponse.json(
          { error: "Subject and message are required" },
          { status: 400 }
        );
      }

      const user = req.session.user;
      const inquiry = await createContactInquiry({
        user_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        customer_number: (user as Record<string, unknown>).customerNumber as string | null ?? null,
        subject: subject.trim(),
        message: message.trim(),
      });

      return NextResponse.json(inquiry, { status: 201 });
    } catch (error) {
      console.error("Error creating inquiry:", error);
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 }
      );
    }
  }
);

// GET /api/contact-inquiry
// Admin → all inquiries (optional ?status=open|in_progress|resolved)
// User  → own inquiries only
export const GET = withRole(
  ["user", "admin"],
  async (req: RequestWithSession) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") as InquiryStatus | null;
      const user = req.session.user;
      const role = (user.role as string | undefined) ?? "user";

      if (role === "admin") {
        const inquiries = await getAllContactInquiries(status ?? undefined);
        return NextResponse.json(inquiries);
      } else {
        const inquiries = await getContactInquiriesByUserId(user.id);
        return NextResponse.json(inquiries);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      return NextResponse.json(
        { error: "Failed to fetch inquiries" },
        { status: 500 }
      );
    }
  }
);
