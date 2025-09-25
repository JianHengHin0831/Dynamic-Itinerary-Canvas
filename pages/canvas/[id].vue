<template>
  <ItineraryPlanner
    v-if="itinerary"
    :canvas-id="canvasId"
    :itinerary="itinerary"
  />
  <div v-else>
    <div class="relative">
      <span
        v-if="copied"
        class="absolute left-0 -bottom-6 bg-gray-800 text-white text-xs rounded py-1 px-2"
      >
        Link Copied!
      </span>
    </div>
    <CanvasToolbar
      :selection-count="selectedItems.length"
      :is-loading="isLoading"
      :has-submitted="currentUserSubmission !== null"
      :collaborators="collaborators"
      :canActivate="canActivate"
      @open-invite-modal="showInviteModal = true"
      @submit-selection="handleSubmitSelection"
      @open-poll-modal="fetchActiveQuestion"
    />

    <ImageUploader :is-loading="isLoading" @file-uploaded="handleFileUpload" />

    <p v-if="isLoading" class="my-4 text-center text-blue-500 animate-pulse">
      AI is thinking...
    </p>
    <p v-if="errorMsg" class="my-4 text-center text-red-500">{{ errorMsg }}</p>

    <CanvasGrid
      v-model:items="items"
      :is-locked="isSelectionLocked"
      :selected-items="selectedItems"
      @order-changed="onDragEnd"
      @item-toggled="toggleSelection"
    />

    <div
      v-if="!items.length && !isInitialLoading"
      class="text-center text-gray-500 mt-10"
    >
      Your canvas is empty. Upload an image to get started!
    </div>
  </div>
  <div
    v-if="showInviteModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">Invite a Collaborator</h3>
      <p class="text-sm text-gray-500 mb-4">
        Enter the email of the user you want to invite. They must have a Travel
        Wizard account.
      </p>
      <input
        v-model="inviteEmail"
        type="email"
        class="w-full p-2 border border-gray-300 rounded-md mb-2"
        placeholder="collaborator@example.com"
      />
      <p v-if="inviteError" class="text-red-500 text-sm mb-4">
        {{ inviteError }}
      </p>
      <div class="flex justify-end space-x-3">
        <button
          @click="closeInviteModal"
          class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          @click="handleInvite"
          :disabled="isInviting"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {{ isInviting ? "Inviting..." : "Send Invite" }}
        </button>
      </div>
    </div>
  </div>
  <!-- Active Question -->
  <LivePoll
    v-if="activeQuestion"
    :question="activeQuestion"
    :total-participants="collaborators.length"
    @nextQuestion="handleNextQuestion"
    @finalProposal="handleFinalProposal"
  />

  <!-- Final Proposal -->
  <div v-else-if="finalProposal" class="p-6 text-center">
    <h2 class="text-3xl font-bold mb-4">🎉 Final Proposal Selected!</h2>
    <h3 class="text-2xl font-semibold mb-2">{{ finalProposal.tag }}</h3>
    <p class="text-lg mb-2">{{ finalProposal.description }}</p>
    <ul class="flex flex-wrap justify-center space-x-3">
      <li
        v-for="city in finalProposal.cities"
        :key="city"
        class="px-4 py-2 bg-gray-800 rounded text-white"
      >
        {{ city }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

definePageMeta({
  layout: "default", // Apply our default layout
});

// State management
const items = ref<any[]>([]);
const isLoading = ref(false); // For AI processing
const isInitialLoading = ref(true); // For initial page load
const errorMsg = ref("");
const selectedItems = ref<string[]>([]);
const showInviteModal = ref(false);
const inviteEmail = ref("");
const isInviting = ref(false);
const inviteError = ref("");

// Composables
const supabase = useSupabaseClient<Database>();
const route = useRoute();
const config = useRuntimeConfig();
const user = useSupabaseUser();
const canvasId = route.params.id as string;
const copied = ref(false);

const collaborators = ref<any[]>([]);
const currentUserSubmission = ref<any | null>(null);

const finalProposal = ref<any | null>(null);

const itinerary = ref(null);

onMounted(async () => {
  const { data } = await supabase
    .from("canvases")
    .select("final_itinerary")
    .eq("id", canvasId)
    .single();

  if (data?.final_itinerary) {
    itinerary.value = JSON.parse(JSON.stringify(data.final_itinerary));
  }
});

const isSelectionLocked = computed(() => {
  return (
    currentUserSubmission.value !== null &&
    currentUserSubmission.value.voted_location_ids?.length > 0
  );
});

function toggleSelection(item: any) {
  // Only allow selecting 'destination_idea' cards for polls
  if (item.type !== "destination_idea") return;
  if (isSelectionLocked.value) {
    return;
  }

  const itemId = item.id;
  const index = selectedItems.value.indexOf(itemId);

  if (index > -1) {
    // Already selected, so unselect it
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
}

async function ensureCanvasExists() {
  if (!user.value) {
    errorMsg.value = "You must be logged in.";
    return;
  }

  // 1. Check if the canvas exists
  const { data: canvas, error: fetchError } = await supabase
    .from("canvases")
    .select("id")
    .eq("id", canvasId)
    .single(); // .single() returns null instead of an empty array if not found

  if (fetchError && fetchError.code !== "PGRST116") {
    // Ignore 'PGRST116' (not found error)
    throw fetchError;
  }

  // 2. If it doesn't exist, create it
  if (!canvas) {
    const { error: insertError } = await supabase.from("canvases").insert({
      id: canvasId,
      name: "My Demo Canvas", // You can make this dynamic later
      owner_id: user.value.id,
    });

    if (insertError) throw insertError;
  }
}

async function fetchData() {
  isInitialLoading.value = true;
  errorMsg.value = "";
  try {
    // Fetch items and collaborators in parallel
    const [itemsResult, collaboratorsResult] = await Promise.all([
      supabase
        .from("canvas_items")
        .select("*")
        .eq("canvas_id", canvasId)
        .order("position"),
      supabase
        .from("canvas_collaborators")
        .select("*")
        .eq("canvas_id", canvasId),
    ]);

    if (itemsResult.error) throw itemsResult.error;
    items.value = itemsResult.data || [];

    if (collaboratorsResult.error) throw collaboratorsResult.error;
    collaborators.value = collaboratorsResult.data || [];

    const userIds = collaborators.value.map((c) => c.user_id);
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Map emails back to the collaborators array
      collaborators.value = collaborators.value.map((collab) => {
        const userProfile = usersData.find((u) => u.id === collab.user_id);
        return { ...collab, email: userProfile?.email || "unknown user" };
      });
    }

    // Find the current user's submission data
    currentUserSubmission.value =
      collaborators.value.find(
        (c) => c.user_id === user.value?.id && c.budget !== null
      ) || null;

    if (isSelectionLocked.value) {
      selectedItems.value = currentUserSubmission.value.voted_location_ids;
    }
  } catch (err: any) {
    errorMsg.value = `Error fetching data: ${err.message}`;
  } finally {
    isInitialLoading.value = false;
  }
}

// --- 2. Handle the file upload and AI processing ---
async function handleFileUpload(file: File) {
  isLoading.value = true;
  errorMsg.value = "";

  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  } else {
    throw new Error("No file selected");
  }

  try {
    // Call Python backend
    const aiResponse = await $fetch<any>(
      `${config.public.apiBaseUrl}/api/v1/inspire-from-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    // --- 3. Insert the AI response into Supabase ---
    for (const dest of aiResponse) {
      const exists = items.value.some(
        (item) => item.content.title === dest.content.title
      );
      if (exists) continue;

      const { data: newItem, error: insertError } = await supabase
        .from("canvas_items")
        .insert({
          canvas_id: canvasId,
          type: dest.type,
          content: dest.content,
          created_by: useSupabaseUser().value?.id || "",
          position: items.value.length,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
      } else {
        // 可选：更新本地 items
        items.value.push(newItem);
      }
    }
  } catch (error: any) {
    errorMsg.value = `Something went wrong: ${error.message}`;
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

const triggerDecisionTree = async () => {
  isLoading.value = true;
  errorMsg.value = "";

  try {
    const res = await $fetch("/api/process-final-submission", {
      method: "POST",
      body: { canvas_id: canvasId },
    });
  } catch (err: any) {
    errorMsg.value = `Failed to start vote: ${err.message || err}`;
  } finally {
    isLoading.value = false;
  }
};
async function handleSubmitSelection(payload: {
  budget: number;
  days: number;
}) {
  if (!user.value) return;

  isLoading.value = true;
  errorMsg.value = "";

  try {
    const { data, error } = await supabase
      .from("canvas_collaborators")
      .update({
        budget: payload.budget,
        days: payload.days,
        voted_location_ids: selectedItems.value,
      })
      .eq("canvas_id", canvasId)
      .eq("user_id", user.value.id)
      .select()
      .single();

    if (error) throw error;

    currentUserSubmission.value = data;
    const index = collaborators.value.findIndex(
      (c) => c.user_id === user.value?.id
    );
    if (index !== -1) {
      collaborators.value[index] = data;
    }

    const allHaveSubmitted = collaborators.value.every(
      (c) => c.budget !== null && c.budget !== undefined
    );

    if (allHaveSubmitted) {
      triggerDecisionTree();
    }
  } catch (err: any) {
    errorMsg.value = `Failed to submit vote: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function onDragEnd() {
  const updates = items.value.map((item, index) =>
    supabase.from("canvas_items").update({ position: index }).eq("id", item.id)
  );

  try {
    await Promise.all(updates);
  } catch (error: any) {
    errorMsg.value = `Failed to save new order: ${error.message}`;
  }
}

let channel: any = null;

function closeInviteModal() {
  showInviteModal.value = false;
  inviteEmail.value = "";
  inviteError.value = "";
}

async function handleInvite() {
  if (!inviteEmail.value.trim() || !canvasId) return;

  isInviting.value = true;
  inviteError.value = "";

  try {
    await $fetch("/api/invite-user", {
      method: "POST",
      body: {
        canvas_id: canvasId,
        email: inviteEmail.value.trim(),
      },
    });

    closeInviteModal();
  } catch (error: any) {
    inviteError.value = error.message;
  } finally {
    isInviting.value = false;
  }
}

const collabChannel = supabase
  .channel(`canvas-collaborators-${canvasId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "canvas_collaborators",
      filter: `canvas_id=eq.${canvasId}`,
    },
    (payload) => {
      // fetchCollaboratorsCount();
      fetchData();
    }
  )
  .subscribe();

// State
const activeQuestion = ref<any | null>(null);

async function fetchActiveQuestion() {
  const { data } = await supabase
    .from("decision_tree_questions")
    .select("*")
    .eq("canvas_id", canvasId)
    .eq("level", 1)
    .single();
  if (!data) return;
  await supabase
    .from("decision_tree_questions")
    .update({ status: "active" })
    .eq("id", data.id);
  activeQuestion.value = data;
}

//activate question
const canvas = ref<any>(null);
const canOwnerActivate = ref(false);
function updateOwnerActivate() {
  canOwnerActivate.value =
    user.value?.id === canvas.value.owner_id &&
    canvas.value.final_proposal !== null &&
    canvas.value.final_location_ids === null;
}

const canActivate = computed(() => canOwnerActivate.value);

onMounted(async () => {
  try {
    await ensureCanvasExists();
    await fetchData();
  } catch (error: any) {
    errorMsg.value = `Failed to initialize canvas: ${error.message}`;
  }
});

onMounted(async () => {
  // 1. canvas current state
  const { data: canvasData, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", canvasId)
    .single();

  if (error) {
    console.error("Failed to fetch canvas:", error);
  } else {
    canvas.value = canvasData;
    updateOwnerActivate();
  }

  // 2. 订阅 canvas 更新
  const channel = supabase
    .channel(`canvas-${canvasId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "canvases",
        filter: `id=eq.${canvasId}`,
      },
      (payload) => {
        canvas.value = payload.new;
        updateOwnerActivate();
        if (canvas.value.finalProposal) {
          activeQuestion.value = null;
          finalProposal.value = canvas.value.finalProposal;
        }
        if (canvas.value.itinerary) {
          itinerary.value = canvas.value.itinerary;
        }
      }
    )
    .subscribe();
});

onMounted(async () => {
  channel = supabase
    .channel(`canvas-${canvasId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "canvas_items",
        filter: `canvas_id=eq.${canvasId}`,
      },
      (payload) => {
        // --- DUPLICATION CHECK ---
        const existingItem = items.value.find(
          (item) => item.id === payload.new.id
        );
        if (!existingItem) {
          items.value.push(payload.new);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "canvas_items",
        filter: `canvas_id=eq.${canvasId}`,
      },
      (payload) => {
        const index = items.value.findIndex(
          (item) => item.id === payload.new.id
        );
        if (index !== -1) {
          items.value[index] = payload.new;
        }
      }
    )
    .subscribe();
});

onMounted(() => {
  const questionChannel = supabase
    .channel(`canvas-${canvasId}-questions`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "decision_tree_questions",
      },
      (payload) => {
        const updatedQuestion = payload.new;

        if (updatedQuestion.status === "active") {
          activeQuestion.value = updatedQuestion;
          finalProposal.value = null;
        } else if (updatedQuestion.status === "finished") {
          activeQuestion.value = null;
        }
      }
    )
    .subscribe((status, err) => {});
});

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel);
  }
  if (collabChannel) supabase.removeChannel(collabChannel);
});

function handleNextQuestion(nextQuestion: any) {
  activeQuestion.value = nextQuestion;
}

function handleFinalProposal(proposal: any) {
  activeQuestion.value = null;
  finalProposal.value = proposal;
}
</script>
