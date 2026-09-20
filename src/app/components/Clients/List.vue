<template>
  <FoldersNode v-for="node in tree" :key="node.path" :node="node" />

  <div
    v-if="unfiled.length > 0 && tree.length > 0"
    class="border-b border-solid border-gray-100 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
  >
    {{ $t('folder.unfiled') }}
  </div>

  <div
    v-for="client in unfiled"
    :key="client.id"
    class="relative overflow-hidden border-b border-solid border-gray-100 last:border-b-0 dark:border-neutral-600"
  >
    <ClientCard :client="client" />
  </div>
</template>

<script setup lang="ts">
const clientsStore = useClientsStore();

const tree = computed(() => buildFolderTree(clientsStore.clients ?? []));

const unfiled = computed(() =>
  (clientsStore.clients ?? []).filter((client) => client.folder === null)
);
</script>
