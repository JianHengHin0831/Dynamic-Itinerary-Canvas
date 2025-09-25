<template>
  <div class="mt-3 relative w-full mb-4" ref="dropdownRef">
    <input
      v-model="searchQuery"
      @focus="dropdownOpen = true"
      @keyup.enter="selectFirstMatch(dayKey)"
      type="text"
      placeholder="Search item..."
      class="w-full border rounded-lg px-3 py-2 text-gray-700 bg-white shadow-sm"
    />
    <!-- 下拉框 -->
    <div
      v-if="dropdownOpen && filteredOptions.length > 0"
      class="absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
    >
      <div
        v-for="item in filteredOptions"
        :key="item.id"
        @click="selectItem(item)"
        class="px-3 py-2 cursor-pointer hover:bg-gray-100"
      >
        <span class="font-medium">{{ item.type }}</span> — {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ dayKey: string }>();
const emit = defineEmits<{
  (e: "addDummy", dayKey: string, item: any): void;
}>();

const searchQuery = ref("");
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const dummyOptions = [
  {
    id: 1,
    type: "Hotel",
    name: "Hello Hotel",
    link: "https://example.com",
    image: "/image_placeholder.png",
  },
  {
    id: 2,
    type: "Restaurant",
    name: "Please Come in Restaurant",
    link: "https://example.com",
    image: "/image_placeholder.png",
  },
  {
    id: 3,
    type: "Location",
    name: "Long long beach",
    link: "https://example.com",
    image: "/image_placeholder.png",
  },
];

// 过滤
const filteredOptions = computed(() =>
  dummyOptions.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

// 点击外面关闭
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}
onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));

// 选择第一个匹配（回车用）
function selectFirstMatch(dayKey: string) {
  if (filteredOptions.value.length > 0) {
    emit("addDummy", dayKey, filteredOptions.value[0]);
    searchQuery.value = "";
    dropdownOpen.value = false;
  }
}

// 点击选项（鼠标用）
function selectItem(item: any) {
  emit("addDummy", props.dayKey, item);
  searchQuery.value = "";
  dropdownOpen.value = false;
}
</script>
