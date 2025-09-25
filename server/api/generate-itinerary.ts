import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/database.types";
import OpenAI from "openai";

interface SubmissionRequest {
  canvas_id: string;
}

const itineraryPrompt = (canvas: any) => `
You are a world-class travel planner. Based on the group's final choices, generate a complete travel itinerary.

**Inputs:**
- Cities: ${canvas.final_location_ids.join(", ")}
- Total Days: ${canvas.final_total_days}
- Budget Per Day: ${canvas.final_budget_per_day} USD

**Rules:**
1. Distribute the days across the cities in a logical order.
2. For each day, provide an array called "items".
3. Each "item" must include:
   - "id": a unique UUID (you can generate dummy ones like "1", "2", "3").
   - "type": one of ["Hotel", "Restaurant", "Location"].
   - "name": the name (can be real, but no problem if placeholder).
   - "link": always "https://example.com".
   - "image": always "/image_placeholder.png".
4. Ensure each day has at least:
   - 1–2 Hotels
   - 2–3 Restaurants
   - 2–3 Locations
5. Output strictly as valid JSON in this format:

{
  "day1": {
    "items": [
      { "id": "1", "type": "Hotel", "name": "Hotel Placeholder", "link": "https://example.com", "image": "/image-placeholder.png" },
      { "id": "2", "type": "Restaurant", "name": "Restaurant Placeholder", "link": "https://example.com", "image": "/image-placeholder.png" },
      { "id": "3", "type": "Location", "name": "Location Placeholder", "link": "https://example.com", "image": "/image-placeholder.png" }
    ]
  },
  "day2": {
    "items": [...]
  }
}
`;

interface SubmissionRequest {
  canvasId: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SubmissionRequest>(event);

  const { canvasId } = body;

  if (!canvasId) throw new Error("canvas_id is required");
  const client = await serverSupabaseClient<Database>(event);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { data: canvas } = await client
    .from("canvases")
    .select("final_location_ids, final_total_days, final_budget_per_day")
    .eq("id", canvasId)
    .single();

  if (!canvas) throw new Error("Canvas not found");

  const prompt = itineraryPrompt(canvas);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a JSON travel itinerary generator." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });
  if (!response.choices[0].message.content) return;

  const itinerary = JSON.parse(response.choices[0].message.content);

  // 存回 canvases
  await client
    .from("canvases")
    .update({ final_itinerary: itinerary })
    .eq("id", canvasId);

  return itinerary;
});
