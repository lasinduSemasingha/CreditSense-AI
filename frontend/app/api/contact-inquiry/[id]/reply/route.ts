import { NextResponse } from "next/server";
import { withRole } from "@/utils/server-permissions";
import type { RequestWithSession } from "@/utils/server-permissions";
import {
  addInquiryReply,
  getContactInquiryById,
} from "@/lib/services/contact-inquiry.service";

// POST /api/contact-inquiry/[id]/reply — add a reply (user or admin)
export const POST = withRole(
  ["user", "admin"],
  async (req: RequestWithSession) => {
    try {
      // path: /api/contact-inquiry/[id]/reply → split gives [..., id, 'reply']
      const parts = req.nextUrl.pathname.split("/");
      const id = parts[parts.length - 2];

      const body = (await req.json()) as { content?: string };
      const { content } = body;

      if (!content?.trim()) {
        return NextResponse.json(
          { error: "Reply content is required" },
          { status: 400 }
        );
      }

      // Validate inquiry exists and user is allowed to reply to it
      const inquiry = await getContactInquiryById(id);
      if (!inquiry) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const user = req.session.user;
      const role = (user.role as string | undefined) ?? "user";
      if (role !== "admin" && inquiry.user_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (inquiry.status === "resolved") {
        return NextResponse.json(
          { error: "Cannot reply to a resolved inquiry" },
          { status: 400 }
        );
      }

      const reply = await addInquiryReply({
        inquiry_id: Number(id),
        sender_role: role === "admin" ? "admin" : "user",
        sender_name: user.name,
        content: content.trim(),
      });

      return NextResponse.json(reply, { status: 201 });
    } catch (error) {
      console.error("Error adding reply:", error);
      return NextResponse.json(
        { error: "Failed to add reply" },
        { status: 500 }
      );
    }
  }
);
