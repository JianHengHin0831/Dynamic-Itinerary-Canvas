<template>
  <div
    class="mb-8 p-4 border-dashed border-2 border-gray-300 rounded-lg text-center"
  >
    <h3 class="text-lg font-medium text-gray-700 mb-2">Get Inspired!</h3>
    <p class="text-sm text-gray-500 mb-4">
      Upload an image of a place you'd love to visit.
    </p>
    <input
      ref="fileInput"
      type="file"
      @change="onFileSelected"
      accept="image/*"
      :disabled="isLoading"
      class="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 disabled:opacity-50"
    />
  </div>
</template>

<script setup lang="ts">
const fileInput = ref<HTMLInputElement | null>(null);

defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["file-uploaded"]);

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  emit("file-uploaded", file);

  // Reset file input to allow re-uploading the same file
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}
</script>
