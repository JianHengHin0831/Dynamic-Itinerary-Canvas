<template>
  <div class="flex justify-between items-center mb-6">
    <!-- Invite Section -->
    <div class="flex items-center">
      <button
        @click="$emit('open-invite-modal')"
        class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Invite
      </button>
      <div v-if="collaborators.length > 0" class="relative group">
        <div class="ml-3 flex items-center cursor-pointer">
          <span class="text-sm font-medium text-gray-700">
            {{ collaborators.length }} collaborator{{
              collaborators.length === 1 ? "" : "s"
            }}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 ml-1 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div
          class="absolute z-10 w-64 p-3 -mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 left-0 top-full transform translate-y-2 pointer-events-none group-hover:pointer-events-auto"
        >
          <h4 class="font-bold text-gray-800 mb-2">Submission Status</h4>
          <ul class="space-y-2">
            <li
              v-for="collab in collaborators"
              :key="collab.user_id"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-gray-600 truncate pr-2">{{
                collab.email || "Loading..."
              }}</span>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  hasUserSubmitted(collab)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800',
                ]"
              >
                {{ hasUserSubmitted(collab) ? "Submitted" : "Pending" }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Submit Selection Button -->
    <div v-if="selectionCount >= 1 && !canActivate">
      <button
        :disabled="hasSubmitted || isLoading"
        @click="openBudgetModal"
        class="font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
        :class="
          hasSubmitted
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        "
      >
        {{ hasSubmitted ? "Submitted (Waiting for others)" : "Submit My Vote" }}
      </button>
    </div>
    <div v-if="canActivate">
      <button
        @click="$emit('open-poll-modal')"
        class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
      >
        Poll for Best Location
      </button>
    </div>

    <!-- Budget & Days Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h3 class="text-xl font-bold mb-4">Confirm Your Vote</h3>
        <p class="text-sm text-gray-600 mb-4">
          Set your personal budget and preferred trip duration for the
          {{ selectionCount }} location(s) you've selected.
        </p>

        <div class="mb-4">
          <label
            class="block text-gray-700 font-semibold mb-2"
            for="budget-slider"
          >
            Budget per day: ${{ budget }}
          </label>
          <input
            id="budget-slider"
            type="range"
            min="50"
            max="2000"
            step="50"
            v-model="budget"
            class="w-full"
          />
        </div>

        <div class="mb-6">
          <label
            class="block text-gray-700 font-semibold mb-2"
            for="days-slider"
          >
            Number of days: {{ days }}
          </label>
          <input
            id="days-slider"
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
            @click="showModal = false"
            class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            @click="handleConfirm"
            class="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  selectionCount: {
    type: Number,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  hasSubmitted: {
    type: Boolean,
    default: false,
  },
  canActivate: {
    type: Boolean,
    default: false,
  },
  collaborators: {
    type: Array as () => any[],
    default: () => [],
  },
});

const emit = defineEmits([
  "open-invite-modal",
  "submit-selection",
  "open-poll-modal",
]);

const showModal = ref(false);
const budget = ref(500);
const days = ref(5);

const openBudgetModal = () => {
  showModal.value = true;
};

function hasUserSubmitted(collaborator: any): boolean {
  return collaborator.budget !== null && collaborator.budget !== undefined;
}

const handleConfirm = () => {
  emit("submit-selection", {
    budget: budget.value,
    days: days.value,
  });
  showModal.value = false;
};
</script>
