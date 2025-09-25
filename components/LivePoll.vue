<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 text-white"
  >
    <div class="text-center max-w-xl">
      <h2 class="text-4xl font-bold mb-4">Live Poll!</h2>
      <p class="text-2xl mb-8">{{ question.question_text }}</p>
      <div
        class="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0 justify-center items-center"
      >
        <button
          @click="vote('A')"
          :disabled="hasVoted"
          class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded disabled:opacity-50"
        >
          {{ question.option_a_text }}
        </button>
        <button
          @click="vote('B')"
          :disabled="hasVoted"
          class="bg-green-500 hover:bg-green-600 px-6 py-3 rounded disabled:opacity-50"
        >
          {{ question.option_b_text }}
        </button>
      </div>

      <div class="mt-8 text-lg">Time remaining: {{ timer }}s</div>

      <div v-if="results.length" class="mt-6 text-left">
        <h3 class="text-xl font-bold mb-2">Current Results:</h3>
        <ul>
          <li v-for="r in results" :key="r.tag">
            {{ r.tag }}: {{ r.count }} votes
          </li>
        </ul>
      </div>

      <div v-if="finalProposals.length" class="mt-6 text-left">
        <h3 class="text-xl font-bold mb-2">Proposals to consider:</h3>
        <ul>
          <li v-for="p in finalProposals" :key="p.id">
            <strong>{{ p.tag }}</strong
            >: {{ p.cities.join(", ") }} - {{ p.description }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useSupabaseClient, useSupabaseUser } from "#imports";

const props = defineProps<{ question: any; totalParticipants: number }>();
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const timer = ref(30);
const hasVoted = ref(false);
const results = ref<{ tag: string; count: number }[]>([]);
const finalProposals = ref<any[]>([]);

const emit = defineEmits<{
  (e: "nextQuestion", question: any): void;
  (e: "finalProposal", proposal: any): void;
}>();

async function vote(option: "A" | "B") {
  if (!user.value) return;

  hasVoted.value = true;
  await supabase.from("live_poll_answers").upsert({
    question_id: props.question.id,
    user_id: user.value.id,
    selected_option: option,
  });
  await checkAllVoted();
}

async function checkAllVoted() {
  // 1. count voted members
  const { count } = await supabase
    .from("live_poll_answers")
    .select("*", { count: "exact", head: true })
    .eq("question_id", props.question.id);

  // find total participants
  const totalParticipants = props.totalParticipants;
  if (count === totalParticipants) {
    clearInterval(interval);
    await calculateResults();
  }
}

// Poll timer
let interval: number;
function startTimer() {
  clearInterval(interval); // old timer pause
  timer.value = 30; // reset time
  interval = window.setInterval(async () => {
    timer.value--;
    if (timer.value <= 0) {
      clearInterval(interval);
      await calculateResults();
    }
  }, 1000);
}

watch(
  () => props.question,
  (newQ, oldQ) => {
    if (newQ && newQ !== oldQ) {
      startTimer(); // reset when question change
      hasVoted.value = false;
    }
  },
  { immediate: true } // run when initialize
);

onUnmounted(() => {
  clearInterval(interval);
});

// Fetch live results
async function calculateResults() {
  // 1. find voted in this questions
  const { data: answers, error } = await supabase
    .from("live_poll_answers")
    .select("selected_option")
    .eq("question_id", props.question.id);

  if (error) {
    console.error("Error fetching votes:", error);
    return;
  }

  // 2. find all votes
  const counts: Record<"A" | "B", number> = { A: 0, B: 0 };
  answers.forEach((a) => {
    counts[a.selected_option as "A" | "B"]++;
  });

  // 3. find who won
  let winningOption: "A" | "B";
  if (counts.A > counts.B) {
    winningOption = "A";
  } else if (counts.B > counts.A) {
    winningOption = "B";
  } else {
    // random when draw
    winningOption = Math.random() > 0.5 ? "A" : "B";
  }

  // check the option => which options
  const winningTags =
    winningOption === "A"
      ? props.question.option_a_tags
      : props.question.option_b_tags;

  // 5. check if it left the last proposal
  if (winningTags.length === 1) {
    // left one proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("canvas_proposals")
      .select("*")
      .eq("canvas_id", props.question.canvas_id)
      .eq("tag", winningTags[0])
      .single();

    if (proposalError) {
      console.error("Error fetching proposal:", proposalError);
      return;
    }

    await supabase
      .from("decision_tree_questions")
      .update({ status: "finished" })
      .eq("id", props.question.id);

    const { error } = await supabase
      .from("canvases")
      .update({
        final_proposal: proposal,
        final_location_ids: proposal.cities,
      })
      .eq("id", props.question.canvas_id);

    // emit to parent components
    generateItineracy();
    alert("the final decision is to the " + proposal.cities);

    if (error) {
      console.error("Supabase update error:", error);
    }
    emit("finalProposal", proposal);
  } else {
    // still have more than one proposal
    hasVoted.value = false;
    const { data: nextQuestion, error: nextError } = await supabase
      .from("decision_tree_questions")
      .select("*")
      .eq("canvas_id", props.question.canvas_id)
      .eq("level", props.question.level + 1) // go to next level
      .eq("parent_option", winningOption) // find the branch
      .single();

    if (nextError) {
      console.error("Error fetching next question:", nextError);
      return;
    }

    // turn the question to be completed, next question be active
    await supabase
      .from("decision_tree_questions")
      .update({ status: "completed" })
      .eq("id", props.question.id);

    await supabase
      .from("decision_tree_questions")
      .update({ status: "active" })
      .eq("id", nextQuestion.id);

    emit("nextQuestion", nextQuestion);
  }
}
const generateItineracy = async () => {
  try {
    const res = await $fetch("/api/generate-itinerary", {
      method: "POST",
      body: { canvasId: props.question.canvas_id },
    });
  } catch (err: any) {
    alert(`Failed to start vote: ${err.message || err}`);
  }
};
</script>
