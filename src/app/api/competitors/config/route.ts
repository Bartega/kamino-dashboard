import { NextResponse } from "next/server";
import {
  getCompetitors,
  addCompetitor,
  removeCompetitor,
} from "@/lib/data/competitor-kv";

export async function GET() {
  const competitors = await getCompetitors();
  return NextResponse.json({ competitors });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "add") {
    const competitors = await addCompetitor({
      twitterHandle: body.twitterHandle,
      displayName: body.displayName || body.twitterHandle,
      defiLlamaSlug: body.defiLlamaSlug,
      addedAt: new Date().toISOString(),
    });
    return NextResponse.json({ competitors });
  }

  if (body.action === "remove") {
    const competitors = await removeCompetitor(body.twitterHandle);
    return NextResponse.json({ competitors });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
