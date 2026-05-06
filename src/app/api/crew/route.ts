// src/app/api/crew/route.ts
import { NextRequest, NextResponse } from "next/server";

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    console.log("🔑 Token from Authorization header");
    return authHeader;
  }

  const token = request.cookies.get("accessToken")?.value;
  if (token) {
    console.log("🍪 Token from cookie, length:", token.length);
    return `Bearer ${token}`;
  }

  console.log("❌ No token found");
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authToken = getAuthToken(request);

    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No auth token found" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const backendUrl = new URL("http://localhost:3001/crew");

    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    console.log("📡 GET:", backendUrl.toString());

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Backend GET error:", error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("Crew fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch crew" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = getAuthToken(request);

    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No auth token found" },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log("📤 POST /crew — payload:", JSON.stringify(data, null, 2));

    const response = await fetch("http://localhost:3001/crew", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authToken,
      },
      body: JSON.stringify(data),
    });

    // Читаем ответ как текст чтобы не терять при JSON.parse ошибке
    const responseText = await response.text();
    console.log("📥 Backend POST response:", response.status, responseText);

    if (!response.ok) {
      let error: object = {};
      try {
        error = JSON.parse(responseText);
      } catch {
        error = { message: responseText };
      }
      console.error("❌ Backend POST error:", JSON.stringify(error, null, 2));
      return NextResponse.json(error, { status: response.status });
    }

    let result: object = {};
    try {
      result = JSON.parse(responseText);
    } catch {
      result = {};
    }
    return NextResponse.json(result, { status: 201 });

  } catch (err) {
    console.error("Crew creation error:", err);
    return NextResponse.json(
      { error: "Failed to create crew member" },
      { status: 500 }
    );
  }
}
