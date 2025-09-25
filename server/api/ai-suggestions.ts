import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ai suggestion to the itinerary
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const itinerary = body.itinerary;

    const prompt = `
    You are a travel assistant. The user has created an itinerary, but they want feedback.
    Check for issues such as:
    - Days that are too empty or too full
    - Missing hotels, restaurants, or attractions
    - Imbalance in distribution across days

    **IMPORTANT**: Return ONLY a JSON array. Do NOT include any markdown, code fences, backticks, or explanatory text. Example output:
    ["Day 1 is heavy on attractions, consider moving one to Day 3.", "Day 4 has no hotel entries."]

    Itinerary JSON:
    ${JSON.stringify(itinerary, null, 2)}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let suggestions: string[] = [];

    try {
      suggestions = JSON.parse(completion.choices[0].message.content || "[]");
    } catch (e) {
      suggestions = [completion.choices[0].message.content || "No suggestions"];
    }

    return { suggestions };
  } catch (err) {
    console.error("AI suggestions error:", err);
    return { suggestions: ["⚠️ Failed to generate AI suggestions"] };
  }
});
