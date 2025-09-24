<template>
  <div
    :class="[
      'rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-200',
      isSelected
        ? 'ring-4 ring-indigo-500 shadow-2xl'
        : 'shadow-lg hover:shadow-xl',
    ]"
  >
    <!-- RENDER DESTINATION IDEA CARD -->
    <div
      v-if="item.type === 'destination_idea'"
      class="bg-white flex-grow flex flex-col"
    >
      <img
        :src="item.content.image || '/image_placeholder.png'"
        :alt="item.content.title"
        class="w-full"
        height="600"
      />
      <div class="p-6 flex-grow">
        <h4 class="text-xl font-bold text-gray-800 mb-2">
          {{ item.content.title }}
        </h4>
        <p class="text-sm font-semibold text-indigo-600 mb-3">
          {{ item.content.vibe }}
        </p>
        <p class="text-gray-600 text-base mb-4">
          {{ item.content.description }}
        </p>
        <div>
          <h5 class="font-semibold mb-2">Suggested Activities:</h5>
          <ul class="list-disc list-inside text-gray-500 text-sm">
            <li
              v-for="(activity, index) in item.content.suggested_activities"
              :key="index"
            >
              {{ activity }}
            </li>
          </ul>
        </div>
      </div>
      <div
        class="bg-gray-50 p-2 flex justify-center items-center cursor-move drag-handle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </div>
    </div>

    <!-- RENDER POLL CARD -->
    <div v-else-if="item.type === 'poll'" class="bg-yellow-50 p-6 flex-grow">
      <h4 class="text-lg font-bold text-gray-800 mb-4 text-center">
        {{ item.content.question }}
      </h4>
      <div class="space-y-3">
        <button
          v-for="option in item.content.options"
          :key="option.id"
          class="w-full text-left p-3 bg-white border rounded-lg hover:bg-gray-100 transition-colors"
        >
          {{ option.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  item: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});
</script>
