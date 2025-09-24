<template>
  <div>
    <!-- The Uploader Component -->
    <div
      class="mb-6 p-4 border-dashed border-2 border-gray-300 rounded-lg text-center"
    >
      <h3 class="text-lg font-medium text-gray-700 mb-2">Get Inspired!</h3>
      <p class="text-sm text-gray-500 mb-4">
        Upload an image of a place you'd love to visit.
      </p>
      <input
        type="file"
        @change="handleFileUpload"
        accept="image/*"
        class="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      />
      <p v-if="isLoading" class="mt-4 text-blue-500 animate-pulse">
        AI is thinking...
      </p>
      <p v-if="errorMsg" class="mt-4 text-red-500">{{ errorMsg }}</p>
    </div>

    <!-- The Canvas Area -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-white shadow-lg rounded-lg overflow-hidden"
      >
        <div class="p-6">
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
      </div>
    </div>
    <div
      v-if="!items.length && !isLoading"
      class="text-center text-gray-500 mt-10"
    >
      Your canvas is empty. Upload an image to get started!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

definePageMeta({
  layout: "default", // Apply our default layout
});

// State management
const items = ref<any[]>([]);
const isLoading = ref(false);
const errorMsg = ref("");

// Composables
const supabase = useSupabaseClient<Database>();
const route = useRoute();
const config = useRuntimeConfig();

const canvasId = route.params.id as string;

// --- 1. Fetch existing items when the page loads ---
async function fetchItems() {
  try {
    const { data, error } = await supabase
      .from("canvas_items")
      .select("*")
      .eq("canvas_id", canvasId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    items.value = data || [];
  } catch (error: any) {
    errorMsg.value = `Error fetching items: ${error.message}`;
  }
}

onMounted(() => {
  fetchItems();
});

// --- 2. Handle the file upload and AI processing ---
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];

  isLoading.value = true;
  errorMsg.value = "";

  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  } else {
    throw new Error("No file selected");
  }

  try {
    // Call our Python backend
    const aiResponse = await $fetch<any>(
      `${config.public.apiBaseUrl}/api/v1/inspire-from-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    // --- 3. Insert the AI response into Supabase ---
    const { error: insertError } = await supabase.from("canvas_items").insert({
      canvas_id: canvasId,
      type: aiResponse.type,
      content: aiResponse.content,
      created_by: useSupabaseUser().value?.id || "",
    });

    if (insertError) throw insertError;

    // --- 4. Refresh the list to show the new item ---
    await fetchItems();
  } catch (error: any) {
    errorMsg.value = `Something went wrong: ${error.message}`;
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}
</script>
