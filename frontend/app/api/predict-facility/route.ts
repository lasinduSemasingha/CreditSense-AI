import { NextRequest, NextResponse } from "next/server";

// Manuji Customer Branch Prediction API (port 8003)
const PREDICTION_API_URL = process.env.CUSTOMER_PREDICTION_API_URL || "http://localhost:8003";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward model_name query param if provided
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get("model_name") || "Random Forest";

    // Call the prediction API
    const response = await fetch(
      `${PREDICTION_API_URL}/predict?model_name=${encodeURIComponent(modelName)}`,
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
