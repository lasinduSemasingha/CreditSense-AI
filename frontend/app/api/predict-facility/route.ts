import { NextRequest, NextResponse } from "next/server";

const PREDICTION_API_URL = process.env.PREDICTION_API_URL || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Call the prediction API
    const response = await fetch(
      `${PREDICTION_API_URL}/predict?model_name=Random%20Forest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Prediction API error:", response.status, response.statusText);
      return NextResponse.json(
        {
          error: "Failed to get prediction",
          details: await response.text(),
        },
        { status: response.status }
      );
    }

    const prediction = await response.json();

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
