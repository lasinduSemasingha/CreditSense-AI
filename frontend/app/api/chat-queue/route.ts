import { Message } from "@/components/chat/types";
import {
  startChatQueue,
  getChatQueuesByStatus,
  QueueStatus,
  updateChatQueueStatus,
} from "@/lib/services/chat-queue.service";
import { RequestWithSession, withRole } from "@/utils/server-permissions";
import { NextResponse } from "next/server";

// ! Temporary dummy implementation
const DUMMY_DATA = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your motorcycle leasing assistant. How can I help you today? Feel free to ask about our leasing options, pricing, available models, or any other questions you might have.",
    type: "text",
    timestamp: "2025-10-30T17:07:04.812Z",
  },
  {
    id: "017a3a6c-4939-4c26-8532-81d1e2e7a21c",
    role: "user",
    content: "hi",
    type: "text",
    timestamp: "2025-10-30T17:07:07.970Z",
  },
  {
    id: "06ac81d0-3aaa-447f-bad8-f963ae27e83a",
    role: "assistant",
    content: "Hi there! How can I assist you with motorcycle leasing today?",
    type: "text",
    timestamp: "2025-10-30T17:07:07.970Z",
  },
  {
    id: "414fbab7-d999-4a14-ae05-ef1f5ba80faf",
    role: "user",
    content: "hello how are you",
    type: "voice",
    timestamp: "2025-10-30T17:07:20.218Z",
    audioUrl: "blob:http://localhost:3000/9a2a3af4-63ae-490d-8b14-6031dda1acb2",
  },
  {
    id: "15d07b6c-8af4-4819-9f68-6621d6d6e99e",
    role: "assistant",
    content:
      "I'm doing well, thanks for asking! How can I help you with your motorcycle leasing questions today?",
    type: "voice",
    timestamp: "2025-10-30T17:07:20.218Z",
    audioUrl: "blob:http://localhost:3000/b3b614bc-8d6d-47d3-8f80-0804e82e11c9",
  },
  {
    id: "66298e28-f96c-4cba-a6e4-ade48ebf889e",
    role: "user",
    content: "what is this/",
    type: "image",
    timestamp: "2025-10-30T17:07:44.825Z",
    imageUrl: "blob:http://localhost:3000/d54ac0b6-1d04-4d3a-934d-91ac53201272",
  },
  {
    id: "d132938b-3fb6-4b12-9d25-5a954b8d34a4",
    role: "assistant",
    content:
      "Sorry, I don't know how to help with that. If you have questions specifically about motorcycle leasing options, eligibility, or pricing, feel free to ask!",
    type: "text",
    timestamp: "2025-10-30T17:07:44.825Z",
  },
];

// export async function POST(req: Request) {
export const POST = withRole(
  ["user", "admin"],
  async (request: RequestWithSession) => {
    try {
      const { history } = (await request.json()) as { history: Message[] };
      const user = request.session.user;
      const userId = user?.id;
      const customerName = user.name;
      const customerNumber = user.customerNumber;

      // TODO: Create chat queue in database and return the queue ID
      const { queueId } = await startChatQueue({
        userId,
        customerName,
        customerNumber,
        history,
      });

      return NextResponse.json({ queueId }, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
);

export const GET = withRole(["admin"], async (request: RequestWithSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as QueueStatus;

    const chatQueues = await getChatQueuesByStatus(status);
    return NextResponse.json(chatQueues);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});

export const PATCH = withRole(
  ["admin"],
  async (request: RequestWithSession) => {
    try {
      const { queueId, status } = (await request.json()) as {
        queueId: string;
        status: QueueStatus;
      };
      await updateChatQueueStatus(queueId, status);
      return NextResponse.json({ message: "Chat queue updated" });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
);
