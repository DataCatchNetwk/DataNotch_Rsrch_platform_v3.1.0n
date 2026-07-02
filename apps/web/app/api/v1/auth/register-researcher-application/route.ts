import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://127.0.0.1:3001";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/auth/register-researcher-application`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to reach the registration service. Please try again later." },
      { status: 502 }
    );
  }
}

