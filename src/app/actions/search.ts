"use server";

import { createClient } from "@/lib/supabase/server";

interface SearchParams {
  city: string;
  label: string;
  district?: string;
  room_type?: string;
  price_min?: number;
  price_max?: number;
}

export async function saveSearch(params: SearchParams): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth_required" };

  // Giới hạn 5 saved searches
  const { count } = await supabase
    .from("saved_searches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 5) {
    // Xoá cái cũ nhất để thêm cái mới
    const { data: oldest } = await supabase
      .from("saved_searches")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (oldest) await supabase.from("saved_searches").delete().eq("id", oldest.id);
  }

  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    ...params,
  });

  return error ? { error: error.message } : {};
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id);
}
