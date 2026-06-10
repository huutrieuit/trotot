import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { path, listingId } = await request.json();
    if (!path || typeof path !== "string") {
      return Response.json({ error: "invalid" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const calls = [
      supabase.rpc("increment_page_view", { p_path: path }).then(() => {}),
    ];

    if (listingId && typeof listingId === "string") {
      calls.push(supabase.rpc("increment_listing_view", { p_listing_id: listingId }).then(() => {}));
    }

    await Promise.all(calls);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
