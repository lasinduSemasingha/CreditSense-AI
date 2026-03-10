import { NextResponse } from "next/server";

const BRANCH_EMPLOYEE_API_URL =
  process.env.BRANCH_EMPLOYEE_API_URL || "http://localhost:8002";

export async function GET() {
  try {
    const response = await fetch(`${BRANCH_EMPLOYEE_API_URL}/labels`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch labels", details: await response.text() },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
