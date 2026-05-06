// src/app/api/crew/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) return authHeader;
  const token = request.cookies.get("accessToken")?.value;
  if (token) return `Bearer ${token}`;
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authToken = getAuthToken(request);
    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log("📤 PUT /crew/:id — sending to backend:", JSON.stringify(data, null, 2));

    const response = await fetch(`http://localhost:3001/crew/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authToken,
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    console.log("📥 Backend raw response:", response.status, responseText);

    if (!response.ok) {
      let error: object = {};
      try { error = JSON.parse(responseText); } catch { error = { message: responseText }; }
      console.error("❌ Backend error:", JSON.stringify(error, null, 2));
      return NextResponse.json(error, { status: response.status });
    }

    let result: object = {};
    try { result = JSON.parse(responseText); } catch { result = {}; }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Crew update error:", err);
    return NextResponse.json(
      { error: "Failed to update crew member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authToken = getAuthToken(request);
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`http://localhost:3001/crew/${params.id}`, {
      method: "DELETE",
      headers: { "Authorization": authToken },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Crew delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete crew member" },
      { status: 500 }
    );
  }
}
