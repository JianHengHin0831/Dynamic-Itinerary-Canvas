import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/database.types";

interface InviteRequest {
  canvas_id: string;
  email: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body: InviteRequest = await readBody(event);

    const client = await serverSupabaseClient<Database>(event);

    const { data: userData, error: userError } = await client
      .from("users")
      .select("id")
      .eq("email", body.email)
      .single();

    if (userError || !userData) {
      throw new Error("User not found. Please make sure they have signed up.");
    }

    const user_id = userData.id;

    const { error: insertError } = await client
      .from("canvas_collaborators")
      .upsert({
        canvas_id: body.canvas_id,
        user_id,
        role: "editor",
      });

    if (insertError) throw insertError;

    return { message: `Successfully invited !` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createError({ statusCode: 400, statusMessage: errorMessage });
  }
});
