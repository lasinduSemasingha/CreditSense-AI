import { NextResponse } from "next/server";
import { withRole } from "@/utils/server-permissions";
import type { RequestWithSession } from "@/utils/server-permissions";
import {
  getContactInquiryById,
  updateInquiryStatus,
} from "@/lib/services/contact-inquiry.service";
import type { InquiryStatus } from "@/lib/services/contact-inquiry.service";

// GET /api/contact-inquiry/[id] — fetch inquiry + replies
// Users can only access their own inquiries
export const GET = withRole(
  ["user", "admin"],
  async (req: RequestWithSession) => {
    try {
      const id = req.nextUrl.pathname.split("/").pop() as string;
      const inquiry = await getContactInquiryById(id);

      if (!inquiry) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const user = req.session.user;
      const role = (user.role as string | undefined) ?? "user";
      if (role !== "admin" && inquiry.user_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(inquiry);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      return NextResponse.json(
        { error: "Failed to fetch inquiry" },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/contact-inquiry/[id] — update status (admin only)
export const PATCH = withRole(
  ["admin"],
  async (req: RequestWithSession) => {
    try {
      const id = req.nextUrl.pathname.split("/").pop() as string;
      const body = (await req.json()) as { status?: InquiryStatus };
      const { status } = body;

      if (!status || !["open", "in_progress", "resolved"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      await updateInquiryStatus(id, status);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }
  }
);
