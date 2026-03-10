import { NextRequest, NextResponse } from "next/server";

// Manuji Branch Employee Performance API (port 8002)
const BRANCH_EMPLOYEE_API_URL =
  process.env.BRANCH_EMPLOYEE_API_URL || "http://localhost:8002";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BRANCH_EMPLOYEE_API_URL}/predict/employee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get employee prediction", details: await response.text() },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
