import { Message } from "@/components/chat/types";
import { getChatQueueById } from "@/lib/services/chat-queue.service";
import { RequestWithSession, withRole } from "@/utils/server-permissions";
import { NextResponse } from "next/server";

// export async function POST(req: Request) {
export const GET = withRole(
  ["user", "admin"],
  async (request: RequestWithSession) => {
    try {
      const queueId = request.nextUrl.pathname.split("/").pop() as string;

      // TODO: Get chat queue populated with messages
      const chatQueue = await getChatQueueById(queueId);

      return NextResponse.json(chatQueue, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
);
