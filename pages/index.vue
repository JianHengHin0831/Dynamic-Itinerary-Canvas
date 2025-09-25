<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Your Canvases</h2>
      <button
        @click="createAndGoToCanvas"
        :disabled="isCreating"
        class="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
      >
        <svg
          v-if="isCreating"
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
        <span>+ Create New Canvas</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-10">
      <p class="text-gray-500">Loading your canvases...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="canvases.length === 0"
      class="text-center py-20 bg-gray-50 rounded-lg"
    >
      <!-- ... (same as before) ... -->
    </div>

    <!-- Canvas List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="canvas in canvases"
        :key="canvas.id"
        class="bg-white rounded-lg shadow group flex flex-col justify-between"
      >
        <NuxtLink
          :to="`/canvas/${canvas.id}`"
          class="block p-6 hover:bg-gray-50 transition-colors flex-grow"
        >
          <h3
            class="font-bold text-lg text-gray-800 truncate group-hover:text-indigo-600"
          >
            {{ canvas.name }}
          </h3>
          <p class="text-sm text-gray-500 mt-2">
            Created on: {{ new Date(canvas.created_at).toLocaleDateString() }}
          </p>
        </NuxtLink>

        <!-- Action Buttons -->
        <div class="border-t border-gray-100 p-2 flex justify-end space-x-2">
          <button
            @click="openEditModal(canvas)"
            class="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            @click="deleteCanvas(canvas.id)"
            class="p-2 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="editingCanvas"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Edit Canvas Name</h3>
        <input
          v-model="editingName"
          type="text"
          class="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter new canvas name"
        />
        <div class="flex justify-end space-x-3">
          <button
            @click="editingCanvas = null"
            class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            @click="updateCanvasName"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

definePageMeta({
  layout: "default",
});

// Type definition for a single canvas
type Canvas = Database["public"]["Tables"]["canvases"]["Row"];

// Composables
const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const router = useRouter();

// State
const canvases = ref<Canvas[]>([]);
const isLoading = ref(true); // For fetching the list
const isCreating = ref(false); // For the create button

const editingCanvas = ref<Canvas | null>(null);
const editingName = ref("");

//fetch data in canvases
async function fetchCanvases() {
  try {
    isLoading.value = true;
    const { data, error } = await supabase
      .from("canvases")
      .select("*")
      .order("created_at", { ascending: false }); // Show newest first

    if (error) throw error;
    canvases.value = data || [];
  } catch (error: any) {
    alert(`Error fetching canvases: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchCanvases();
});

// --- ACTIONS ---
async function createAndGoToCanvas() {
  if (!user.value) return;
  isCreating.value = true;

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      name: `My New Trip - ${new Date().toLocaleDateString()}`, // initialize first, can change later in home page
      owner_id: user.value.id,
    })
    .select("id")
    .single();

  if (error) {
    alert(error.message);
    isCreating.value = false;
    return;
  }

  const { error: groupError } = await supabase
    .from("canvas_collaborators")
    .insert({
      canvas_id: data.id,
      user_id: user.value.id,
      role: "editor",
    })
    .single();

  if (groupError) {
    alert(groupError.message);
    isCreating.value = false;
    return;
  }

  if (data) {
    // go to the new page
    router.push(`/canvas/${data.id}`);
  }
  isCreating.value = false;
}

function openEditModal(canvas: Canvas) {
  editingCanvas.value = canvas;
  editingName.value = canvas.name; // Pre-fill the input with the current name
}

async function updateCanvasName() {
  if (!editingCanvas.value || !editingName.value.trim()) return;

  const { data, error } = await supabase
    .from("canvases")
    .update({ name: editingName.value.trim() })
    .eq("id", editingCanvas.value.id)
    .select();

  if (error) {
    // catch database-level errors
    alert(`Error updating name: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    alert(
      "Update failed. You might not have the required permissions. Please refresh and try again."
    );
    return;
  }

  const index = canvases.value.findIndex(
    (c) => c.id === editingCanvas.value!.id
  );
  if (index !== -1 && canvases.value[index]) {
    canvases.value[index].name = editingName.value.trim();
  }
  editingCanvas.value = null;
  editingName.value = "";
}

// delete canvas function
async function deleteCanvas(canvasId: string) {
  // Ask for confirmation
  if (
    !confirm(
      "Are you sure you want to delete this canvas? This will also delete all its content and cannot be undone."
    )
  ) {
    return;
  }

  const { error } = await supabase.from("canvases").delete().eq("id", canvasId);

  if (error) {
    alert(`Error deleting canvas: ${error.message}`);
  } else {
    // Remove from local state for an instant UI change
    // @ts-ignore
    canvases.value = canvases.value.filter((c: any) => c.id !== canvasId);
  }
}
</script>
