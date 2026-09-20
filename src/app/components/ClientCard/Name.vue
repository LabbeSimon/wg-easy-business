<template>
  <div
    class="break-all text-sm text-gray-700 md:text-base dark:text-neutral-200"
    :title="$t('client.createdOn', { date: $d(new Date(client.createdAt)) })"
  >
    {{ client.name }}
    <span
      v-if="showOwner"
      class="text-xs text-gray-400 dark:text-neutral-400"
      :title="$t('client.owner')"
    >
      — {{ client.user.name }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  client: LocalClient;
}>();

const clientsStore = useClientsStore();

// naming the owner is only useful once devices belong to more than one person
const showOwner = computed(
  () =>
    new Set((clientsStore.clients ?? []).map((client) => client.userId)).size >
    1
);
</script>
