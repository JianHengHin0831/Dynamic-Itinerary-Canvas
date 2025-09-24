<template>
  <div>
    <header class="bg-white shadow">
      <div
        class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center"
      >
        <h1 class="text-2xl font-bold text-gray-900">TravelWizard Canvas</h1>
        <button
          @click="handleLogout"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
    <main>
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const supabase = useSupabaseClient();

const router = useRouter();
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error);
    return;
  }
  // The middleware will handle redirecting to /login
  await router.push("/login");
};
</script>
