import { NextRequest, NextResponse } from "next/server";

// Lasindu Impairment & ECL API (port 8001)
const IMPAIRMENT_API_URL =
  process.env.IMPAIRMENT_API_URL || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${IMPAIRMENT_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get prediction", details: await response.text() },
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
