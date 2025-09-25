import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~/types/database.types";
import OpenAI from "openai";

interface SubmissionRequest {
  canvas_id: string;
}

// Master prompt function
const masterPrompt = (preferences: any) => `
You are a world-class travel agent and a master facilitator for group decisions. Your task is to analyze a group's travel preferences and generate 5 distinct, creative travel proposals. Then, create a binary decision tree of questions to help the group choose one proposal.

**Group Preferences:**
${JSON.stringify(preferences, null, 2)}

**Your Task (Strict Instructions):**

**Part 1: Generate 5 Proposals**
1.  Analyze all preferences (voted locations, budgets, days).
2.  Synthesize these into 5 diverse proposals. A proposal can be a single city or a multi-city trip (like ["Kuala Lumpur", "Penang"]).
3.  Proposals should be creative and reflect different aspects of the group's interests (e.g., one for adventure, one for relaxation, one for budget, one for culture).
4.  Assign a unique single-letter tag to each proposal: "A", "B", "C", "D", "E".

**Part 2: Create a Decision Tree**
1.  Design a series of 2-3 binary choice questions that progressively narrow down the 5 proposals.
2.  The first question should split the 5 proposals into two groups (e.g., 2 vs 3 or 3 vs 2).
3.  Subsequent questions should split the remaining proposals until only one is left.
4.  Questions should be engaging and focus on the core "vibe" or trade-off (e.g., "Do you prefer bustling city life or serene nature escapes?").

**Part 3: Final JSON Output**
Your response MUST be a single, valid JSON object with EXACTLY this structure:
{
  "proposals": [
    { "tag": "A", "cities": ["Kuala Lumpur", "Penang"], "description": "A vibrant journey through Malaysia's cultural and culinary hubs." },
    { "tag": "B", "cities": ["Singapore"], "description": "Experience the futuristic metropolis with world-class attractions." },
    { "tag": "C", "cities": ["Shanghai"], "description": "Dive into a blend of historic charm and futuristic skylines." },
    { "tag": "D", "cities": ["Dubai"], "description": "Indulge in luxury, desert adventures, and iconic architecture." },
    { "tag": "E", "cities": ["London"], "description": "Explore centuries of history, royal landmarks, and a vibrant arts scene." }
  ],
  "questions": [
    {
      "level": 1,
      "question_text": "Do you prefer the vibrant, humid energy of Southeast Asia or the grand, historic cities of other regions?",
      "option_a_text": "Southeast Asia's energy",
      "option_a_tags": ["A", "B"],
      "option_b_text": "Grand historic cities",
      "option_b_tags": ["C", "D", "E"]
    },
    {
      "level": 2,
      "parent_option": "A", // Which option from the previous level leads to this question
      "question_text": "Are you looking for a multi-city cultural deep-dive or a single, hyper-modern metropolis?",
      "option_a_text": "Multi-city adventure",
      "option_a_tags": ["A"],
      "option_b_text": "Hyper-modern hub",
      "option_b_tags": ["B"]
    },
    {
      "level": 2,
      "parent_option": "B", // Which option from the previous level leads to this question
      "question_text": "Do you lean towards exploring rich history or experiencing peak luxury?",
      "option_a_text": "Rich history",
      "option_a_tags": ["E"],
      "option_b_text": "Peak luxury",
      "option_b_tags": ["D", "C"] 
    },
    {
      "level": 2,
      "parent_option": "B", // Which option from the previous level leads to this question
      "question_text": "Do you prefer the vibrant, humid energy of Southeast Asia or the grand, historic cities of other regions??",
      "option_a_text": "Southeast Asia's energy",
      "option_a_tags": ["D"],
      "option_b_text": "Grand historic cities",
      "option_b_tags": ["c"] // the last level tags must be length of 1
    }
  ]
}
`;

export default defineEventHandler(async (event) => {
  try {
    // 1. read body
    const body = await readBody<SubmissionRequest>(event);
    const { canvas_id } = body;

    if (!canvas_id) throw new Error("canvas_id is required");
    const client = await serverSupabaseClient<Database>(event);

    // 3.initialize OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { data: preferences, error: prefError } = await client
      .from("canvas_collaborators")
      .select("budget, days, voted_location_ids")
      .eq("canvas_id", canvas_id);

    if (prefError) throw prefError;

    const finalBudget = preferences.reduce(
      (sum, p) => sum + (p.budget ?? 0),
      0
    );
    const finalDays =
      preferences.reduce((sum, p) => sum + (p.days ?? 0), 0) /
      preferences.length;

    const locationCounts: Record<string, number> = {};
    preferences.forEach((p) => {
      p.voted_location_ids?.forEach((loc) => {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });
    });

    const { data: updatedCanvas, error: updateError } = await client
      .from("canvases")
      .update({
        final_budget_per_day: finalBudget,
        final_total_days: finalDays,
        final_proposal: locationCounts,
      })
      .eq("id", canvas_id)
      .select()
      .single();
    if (updateError) throw updateError;

    const updatedPeferences = {
      group_size: Object.values(locationCounts).reduce((a, b) => a + b, 0),
      total_budget: finalBudget * finalDays,
      average_days: finalDays,
      voted_locations: Object.entries(locationCounts).map(([id, votes]) => ({
        location_id: id,
        votes: votes,
      })),
    };

    // 5. call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: masterPrompt(updatedPeferences),
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || "");

    // 6. save to database
    // remove old data
    await client
      .from("decision_tree_questions")
      .delete()
      .eq("canvas_id", canvas_id);
    await client.from("canvas_proposals").delete().eq("canvas_id", canvas_id);

    // insert new proposals
    const proposalsToInsert = aiResult.proposals.map((p: any) => ({
      ...p,
      canvas_id,
    }));
    const { error: propError } = await client
      .from("canvas_proposals")
      .insert(proposalsToInsert)
      .select();
    if (propError) throw propError;

    // insert new questions
    const questionsToInsert = aiResult.questions.map((q: any) => ({
      canvas_id,
      level: q.level,
      parent_option: q.parent_option || "",
      question_text: q.question_text,
      option_a_text: q.option_a_text,
      option_a_tags: q.option_a_tags as string[],
      option_b_text: q.option_b_text,
      option_b_tags: q.option_b_tags as string[],
      status: q.level === "pending",
    }));

    const { error: questError } = await client
      .from("decision_tree_questions")
      .insert(questionsToInsert);

    if (questError) throw questError;

    return { message: "Decision tree created!" };
  } catch (error: any) {
    return { error: error.message || String(error) };
  }
});
