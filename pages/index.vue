<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Your Canvases</h2>
    <p>Welcome! Here you would see a list of your travel plans.</p>

    <!-- For this hackathon, we'll just link to a hardcoded canvas ID -->
    <NuxtLink
      to="/canvas/b5a4b2a8-9c1d-4f7e-8c3b-2a1d9f8e7c6b"
      class="mt-4 inline-block bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
    >
      Go to My Demo Canvas
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// This page is protected by the Supabase middleware because we didn't exclude it.
definePageMeta({
  layout: "default", // Apply our default layout
});
</script>
