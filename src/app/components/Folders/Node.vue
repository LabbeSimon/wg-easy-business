<template>
  <div>
    <div
      class="flex items-center gap-2 border-b border-solid border-gray-100 bg-gray-50 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
      :style="{ paddingLeft: `${0.75 + (node.depth - 1) * 1.25}rem` }"
    >
      <button
        type="button"
        class="rounded p-1 text-gray-400 transition hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-600"
        :title="collapsed ? $t('folder.expand') : $t('folder.collapse')"
        @click="collapsed = !collapsed"
      >
        <IconsArrowDown
          class="w-4 transition-transform"
          :class="{ '-rotate-90': collapsed }"
        />
      </button>

      <span class="truncate text-sm font-medium dark:text-neutral-200">
        {{ node.name }}
      </span>

      <span class="text-xs text-gray-400 dark:text-neutral-400">
        {{ node.enabledClientCount }}/{{ node.totalClientCount }}
      </span>

      <BaseTooltip
        v-if="node.depth >= FOLDER_DEPTH_WARNING"
        :text="$t('folder.tooDeep', { depth: FOLDER_DEPTH_WARNING })"
      >
        <IconsWarning class="w-4 text-gray-400 dark:text-neutral-400" />
      </BaseTooltip>

      <div v-if="canManage" class="ml-auto flex items-center gap-2">
        <FoldersRenameDialog :path="node.path" />
        <BaseSwitch
          :model-value="node.enabledClientCount > 0"
          :title="
            node.enabledClientCount > 0
              ? $t('folder.disableAll')
              : $t('folder.enableAll')
          "
          @update:model-value="toggle"
        />
      </div>
    </div>

    <template v-if="!collapsed">
      <div
        v-for="client in clients"
        :key="client.id"
        class="relative overflow-hidden border-b border-solid border-gray-100 last:border-b-0 dark:border-neutral-600"
      >
        <ClientCard :client="client" />
      </div>

      <FoldersNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FolderNode } from '#shared/utils/folders';

defineOptions({ name: 'FoldersNode' });

const props = defineProps<{
  node: FolderNode;
}>();

const collapsed = ref(false);

const clientsStore = useClientsStore();
const authStore = useAuthStore();

const canManage = computed(
  () =>
    authStore.userData !== null &&
    hasPermissions(authStore.userData, 'folders', 'manage')
);

const clients = computed(() =>
  (clientsStore.clients ?? []).filter(
    (client) => client.folder === props.node.path
  )
);

const _toggleFolder = useSubmit(
  (data) =>
    $fetch('/api/folder/toggle', {
      method: 'post',
      body: data,
    }),
  {
    revert: () => clientsStore.refresh(),
    noSuccessToast: true,
  }
);

function toggle(enabled: boolean | undefined) {
  if (enabled === undefined) return;

  return _toggleFolder({ path: props.node.path, enabled });
}
</script>
