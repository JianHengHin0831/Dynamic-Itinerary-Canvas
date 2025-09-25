<template>
  <div class="p-6 grid gap-6">
    <h2 class="text-2xl font-bold mb-4">🗺️ Final Itinerary</h2>

    <!-- 每天的计划 -->
    <div
      v-for="(dayPlan, dayKey) in localItinerary"
      :key="dayKey"
      class="bg-white shadow rounded-lg p-4"
    >
      <h3 class="text-xl font-semibold mb-2">{{ dayKey }}</h3>
      <!-- Add Dummy Item -->
      <SearchDropdown :day-key="String(dayKey)" @add-dummy="addDummy" />
      <!-- Draggable Items -->
      <draggable
        v-model="localItinerary[dayKey].items"
        group="itinerary"
        item-key="id"
        class="grid gap-4"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
      >
        <template #item="{ element }">
          <div
            class="flex bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-lg transition cursor-grab select-none"
          >
            <!-- 左边图片 -->
            <img
              :src="'/image_placeholder.png'"
              alt="thumbnail"
              class="w-24 h-24 object-cover"
            />

            <!-- 中间内容 -->
            <div class="flex-1 p-3 flex flex-col justify-between">
              <div>
                <p class="text-sm text-gray-500 uppercase tracking-wide">
                  {{ element.type }}
                </p>
                <p class="font-semibold text-lg text-gray-800 line-clamp-1">
                  {{ element.name }}
                </p>
              </div>
              <a
                :href="element.link"
                target="_blank"
                class="text-blue-500 text-sm underline hover:text-blue-700 mt-1 self-start"
              >
                View
              </a>
            </div>

            <!-- 删除按钮 -->
            <button
              class="text-red-500 hover:text-red-700 p-3 self-start"
              @click="removeItem(String(dayKey), element)"
            >
              ✕
            </button>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Save Button -->
    <div class="mt-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">AI Suggestions</h3>

      <div
        v-if="aiSuggestions.length"
        class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded"
      >
        <h3 class="font-bold text-yellow-700 mb-2">AI Suggestions</h3>
        <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li v-for="(s, i) in aiSuggestions" :key="i">{{ s }}</li>
        </ul>
      </div>

      <button
        @click="getAISuggestions"
        class="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Generate AI Suggestions
      </button>
    </div>

    <button
      @click="saveItinerary"
      class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Save Itinerary
    </button>
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import type { Database } from "~/types/database.types";
import SearchDropdown from "./SearchDropdown.vue";

const props = defineProps<{
  itinerary: any;
  canvasId: string;
}>();

const supabase = useSupabaseClient<Database>();

// 本地副本，避免直接改 props
const localItinerary = ref(JSON.parse(JSON.stringify(props.itinerary)));

// 保存到数据库
async function saveItinerary() {
  const { error } = await supabase
    .from("canvases")
    .update({ final_itinerary: localItinerary.value })
    .eq("id", props.canvasId);

  if (error) {
    console.error("Save failed:", error);
  } else {
    alert("Saved successfully!");
  }
}

function removeItem(dayKey: string, item: any) {
  console.log("removing");
  localItinerary.value[dayKey].items = localItinerary.value[
    dayKey
  ].items.filter((i: any) => i.id !== item.id);
}

function addDummy(dayKey: string, item: any) {
  const newItem = { ...item, id: Date.now() };
  localItinerary.value[dayKey].items.push(newItem);
}

const aiSuggestions = ref<string[]>([]);
async function getAISuggestions() {
  try {
    const response = await $fetch("/api/ai-suggestions", {
      method: "POST",
      body: { itinerary: localItinerary.value },
    });

    let parsed = response.suggestions;
    console.log(parsed);
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = [];
      }
    }

    aiSuggestions.value = parsed;
  } catch (err) {
    console.error("AI Suggestion error:", err);
    aiSuggestions.value = ["⚠️ Failed to fetch AI suggestions"];
  }
}
</script>
<style lang="css">
.drag-chosen {
  transform: scale(1.03);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  cursor: grabbing !important;
}

.drag-ghost {
  opacity: 0.4;
}
</style>
