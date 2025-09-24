<template>
  <div class="flex justify-between items-center mb-6">
    <div class="relative">
      <button
        @click="$emit('open-invite-modal')"
        class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Invite
      </button>
      <span class="text-sm text-gray-700">
        {{ collaboratorsCount }} collaborator{{
          collaboratorsCount === 1 ? "" : "s"
        }}
      </span>
    </div>
    <button
      v-if="selectionCount >= 2"
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

const copied = ref(false);
function copyInviteLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });
}
</script>
