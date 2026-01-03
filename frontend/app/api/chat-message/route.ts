import { Message } from "@/components/chat/types";
import { addMessageToChatQueue } from "@/lib/services/chat-message.service";
import { RequestWithSession, withRole } from "@/utils/server-permissions";
import { NextResponse } from "next/server";

export const POST = withRole(
  ["user", "admin"],
  async (request: RequestWithSession) => {
    try {
      const { queueId, message } = (await request.json()) as {
        queueId: string;
        message: Message;
      };

      // TODO: Add message to chat queue in database
      await addMessageToChatQueue({ queueId, message });

      return NextResponse.json(
        {
          success: true,
        },
        { status: 201 }
      );
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
);
