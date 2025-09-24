<template>
  <div class="flex justify-between items-center mb-6">
    <div class="relative">
      <button
        @click="$emit('open-invite-modal')"
        class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Invite
      </button>
      <span class="text-sm text-gray-700 mx-2">
        {{ collaboratorsCount }} collaborator{{
          collaboratorsCount === 1 ? "" : "s"
        }}
      </span>
    </div>
    <button
      v-if="ignoreFirst"
      @click="$emit('generate-poll')"
      :disabled="isLoading"
      class="bg-purple-600 text-white font-bold py-2 px-8 rounded hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
    >
      <svg
        v-if="isLoading"
        class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span>Generate AI Poll</span>
    </button>
    <div
      v-if="selectionCount >= 1"
      class="flex flex-col gap-4 p-4 border rounded bg-gray-50"
    ></div>
    <button
      v-if="selectionCount >= 1"
      :disabled="hasSubmitted || isLoading"
      @click="openBudgetModal"
      class="font-bold py-2 px-6 rounded hover:bg-green-600 transition-colors disabled:opacity-50"
      :class="
        hasSubmitted
          ? 'bg-gray-200 cursor-not-allowed text-black'
          : 'bg-green-500 hover:bg-green-600 text-white'
      "
    >
      {{ hasSubmitted ? "Waiting for other responses" : "Submit Selection" }}
    </button>
    <div
      v-if="showModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div class="bg-white p-6 rounded shadow-lg w-96">
        <h3 class="text-lg font-bold mb-4">Set Budget & Days</h3>

        <div class="mb-4">
          <label class="block text-gray-700 font-semibold mb-1"
            >Budget per day: {{ budget }}</label
          >
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            v-model="budget"
            class="w-full"
          />
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-semibold mb-1"
            >Number of days: {{ days }}</label
          >
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            v-model="days"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-4">
          <button
            @click="submitSelection"
            class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
          >
            Confirm
          </button>
          <button
            @click="showModal = false"
            class="bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  selectionCount: {
    type: Number,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  collaboratorsCount: { type: Number, default: 0 },
});

defineEmits(["generate-poll", "open-invite-modal"]);

const ignoreFirst = ref(false);

const showSliders = ref(false);
const budget = ref(500);
const days = ref(5);

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const route = useRoute();
const canvasId = route.params.id as string;
const showModal = ref(false);
const hasSubmitted = ref(false);

const openBudgetModal = () => {
  showModal.value = true;
};

const submitSelection = async () => {
  if (!user.value) return;

  const { data, error } = await supabase
    .from("canvas_collaborators")
    .update({ budget: budget.value, days: days.value })
    .eq("canvas_id", canvasId)
    .eq("user_id", user.value.id);

  if (error) {
    console.error("Failed to update selection:", error);
  } else {
    console.log("Selection saved:", data);
    showSliders.value = false;
  }
};

onMounted(async () => {
  if (!user.value) return;
  const { data } = await supabase
    .from("canvas_collaborators")
    .select("*")
    .eq("canvas_id", canvasId)
    .eq("user_id", user.value.id)
    .single();

  if (data?.budget || data?.days) hasSubmitted.value = true;
});
</script>
