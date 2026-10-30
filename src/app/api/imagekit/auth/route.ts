import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { authenticationParameters, imageKitConfigured } from "@/lib/imagekit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!imageKitConfigured()) {
    return NextResponse.json({ error: "IMAGEKIT_NOT_CONFIGURED" }, { status: 503 });
  }

  return NextResponse.json(authenticationParameters(), {
    headers: { "Cache-Control": "no-store" },
  });
}
