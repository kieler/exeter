import { getUser } from "@/lib/auth";
import { rrwebEventRepository } from "@/lib/events";
import { sessionRepository } from "@/lib/sessions";
import { PATH_SIGN_IN } from "@/routes";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Returns one authenticated session's rrweb events in logical event order. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(request.headers);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", signIn: PATH_SIGN_IN },
      { status: 401 },
    );
  }

  const { id } = await params;
  const session = await sessionRepository.getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  try {
    const events = await rrwebEventRepository.getRrwebEvents(session.id);

    return NextResponse.json(events, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load rrweb events.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
