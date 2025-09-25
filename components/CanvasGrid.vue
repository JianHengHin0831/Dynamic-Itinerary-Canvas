<template>
  <draggable
    :model-value="items"
    @update:model-value="$emit('update:items', $event)"
    tag="div"
    item-key="id"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    handle=".drag-handle"
    @end="$emit('order-changed')"
  >
    <template #item="{ element: item }">
      <CanvasItemCard
        :item="item"
        :isSelected="selectedItems.includes(item.id)"
        @click="$emit('item-toggled', item)"
        :is-locked="isLocked"
      />
    </template>
  </draggable>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";

defineProps({
  items: {
    type: Array,
    required: true,
  },
  selectedItems: {
    type: Array,
    required: true,
  },
  isLocked: { type: Boolean, default: false },
});

defineEmits(["update:items", "order-changed", "item-toggled"]);
</script>
