<template>
  <div>
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
      :collaborators-count="collaboratorsCount"
      @generate-poll="generatePoll"
      @open-invite-modal="showInviteModal = true"
    />

    <ImageUploader :is-loading="isLoading" @file-uploaded="handleFileUpload" />

    <p v-if="isLoading" class="my-4 text-center text-blue-500 animate-pulse">
      AI is thinking...
    </p>
    <p v-if="errorMsg" class="my-4 text-center text-red-500">{{ errorMsg }}</p>

    <CanvasGrid
      v-model:items="items"
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

function toggleSelection(item: any) {
  // Only allow selecting 'destination_idea' cards for polls
  if (item.type !== "destination_idea") return;

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
    console.log(`Canvas ${canvasId} not found, creating it...`);
    const { error: insertError } = await supabase.from("canvases").insert({
      id: canvasId,
      name: "My Demo Canvas", // You can make this dynamic later
      owner_id: user.value.id,
    });

    if (insertError) throw insertError;
  }
}

// --- 1. Fetch existing items when the page loads ---
async function fetchItems() {
  try {
    isInitialLoading.value = true;
    const { data, error } = await supabase
      .from("canvas_items")
      .select("*")
      .eq("canvas_id", canvasId)
      .order("position", { ascending: true });

    if (error) throw error;
    items.value = data || [];
  } catch (error: any) {
    errorMsg.value = `Error fetching items: ${error.message}`;
  }
}

const collaboratorsCount = ref(0);

async function fetchCollaboratorsCount() {
  try {
    const { data, error } = await supabase
      .from("canvas_collaborators")
      .select("user_id", { count: "exact" })
      .eq("canvas_id", canvasId);

    if (error) throw error;

    collaboratorsCount.value = data?.length;
  } catch (error: any) {
    console.error("Failed to fetch collaborators:", error.message);
  }
}

onMounted(async () => {
  try {
    await ensureCanvasExists();
    await fetchItems();
    await fetchCollaboratorsCount();
  } catch (error: any) {
    errorMsg.value = `Failed to initialize canvas: ${error.message}`;
  }
});
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
    // Call our Python backend
    // const aiResponse = await $fetch<any>(
    //   `${config.public.apiBaseUrl}/api/v1/inspire-from-image`,
    //   {
    //     method: "POST",
    //     body: formData,
    //   }
    // );
    // console.log(aiResponse);
    const aiResponse = [
      {
        type: "destination_idea",
        content: {
          title: "Kuala Lumpur, Malaysia",
          vibe: "Vibrant, Cosmopolitan, Modern",
          description:
            "Kuala Lumpur, the bustling capital of Malaysia, is a vibrant metropolis known for its modern skyline dominated by the iconic Petronas Twin Towers. This city offers a diverse cultural experience, bustling street markets, and a dynamic culinary scene, making it a truly cosmopolitan destination.",
          suggested_activities: [
            "Visit the Petronas Towers",
            "Explore Batu Caves",
            "Enjoy street food at Jalan Alor",
            "Shop at Suria KLCC",
          ],
          image_url: "image_placeholder.png",
        },
      },
      {
        type: "destination_idea",
        content: {
          title: "Shanghai, China",
          vibe: "Dynamic, Futuristic, Cultural",
          description:
            "Shanghai is a city where futuristic skyscrapers seamlessly blend with rich historical sites. The bustling vibe of the city is complemented by beautiful riverfronts, innovative architecture, and a vibrant arts scene, making it a hub of culture and modernity.",
          suggested_activities: [
            "Walk along the Bund",
            "Visit Shanghai Tower",
            "Explore Yu Garden",
            "Discover French Concession",
          ],
          image_url: "image_placeholder.png",
        },
      },
      {
        type: "destination_idea",
        content: {
          title: "Dubai, UAE",
          vibe: "Extravagant, Luxurious, Futuristic",
          description:
            "Dubai is a city known for its luxurious lifestyle, cutting-edge architecture, and extravagant attractions. From the awe-inspiring Burj Khalifa to the palm-shaped islands, Dubai offers a blend of modern wonders and rich cultural experiences.",
          suggested_activities: [
            "See Burj Khalifa",
            "Shop at Dubai Mall",
            "Explore Palm Jumeirah",
            "Desert Safari",
          ],
          image_url: "image_placeholder.png",
        },
      },
    ];

    alert(
      "The suggested locations are:\n " +
        aiResponse.map((dest) => dest.content.title).join("\n ")
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

async function onDragEnd() {
  const updates = items.value.map((item, index) =>
    supabase.from("canvas_items").update({ position: index }).eq("id", item.id)
  );

  try {
    await Promise.all(updates);
  } catch (error: any) {
    errorMsg.value = `Failed to save new order: ${error.message}`;
    await fetchItems();
  }
}

let channel: any = null;

onMounted(async () => {
  await fetchItems();

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
        console.log("Realtime INSERT received!", payload);

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
        console.log("Realtime UPDATE received!", payload);
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

// --- NEW: GENERATE POLL FUNCTION ---
async function generatePoll() {
  if (selectedItems.value.length !== 2) return;

  isLoading.value = true;
  errorMsg.value = "";

  try {
    const optionA_full = items.value.find(
      (i) => i.id === selectedItems.value[0]
    );
    const optionB_full = items.value.find(
      (i) => i.id === selectedItems.value[1]
    );

    if (!optionA_full || !optionB_full)
      throw new Error("Selected items not found.");

    // Call our new backend endpoint
    const pollContent = await $fetch<any>(
      `${config.public.apiBaseUrl}/api/v1/generate-poll`,
      {
        method: "POST",
        body: {
          optionA: optionA_full.content,
          optionB: optionB_full.content,
        },
      }
    );

    // Insert the new poll card into Supabase
    const { error: insertError } = await supabase.from("canvas_items").insert({
      canvas_id: canvasId,
      type: "poll", // The new card type!
      content: pollContent,
      created_by: user.value?.id || "",
      position: items.value.length,
    });

    if (insertError) throw insertError;

    // Clear selection after poll is created
    selectedItems.value = [];

    // Realtime will handle adding the poll to the UI for everyone
  } catch (error: any) {
    errorMsg.value = `Failed to create poll: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

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
    const response = await $fetch("/api/invite-user", {
      method: "POST",
      body: {
        canvas_id: canvasId,
        email: inviteEmail.value.trim(),
      },
    });

    // Success!
    alert(`Invitation sent!`);
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
      fetchCollaboratorsCount();
    }
  )
  .subscribe();

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel);
    if (collabChannel) supabase.removeChannel(collabChannel);
  }
});
</script>
