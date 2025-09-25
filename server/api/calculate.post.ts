import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const client = await serverSupabaseClient(event);

  const { question_id } = body;

  // get question and vote
  const { data: question } = await client
    .from("decision_tree_questions")
    .select("*")
    .eq("id", question_id)
    .single();

  const { data: votes } = await client
    .from("live_poll_answers")
    .select("*")
    .eq("question_id", question_id);

  if (!question) return { error: "Question not found" };

  //calculate which option more people vote
  const counts: Record<string, number> = {};
  votes?.forEach((v: any) => {
    const tags =
      v.selected_option === "A"
        ? question.option_a_tags
        : question.option_b_tags;
    tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
  });

  const maxVotes = Math.max(...Object.values(counts));
  const winningTags = Object.entries(counts)
    .filter(([_, count]) => count === maxVotes)
    .map(([tag]) => tag);

  const { data: proposals } = await client
    .from("canvas_proposals")
    .select("*")
    .eq("canvas_id", question.canvas_id)
    .in("tag", winningTags);

  return { results: counts, finalProposals: proposals };
});
