<template>
  <BaseDialog @update:open="resetOnOpen">
    <template #trigger>
      <button
        type="button"
        class="rounded p-1 text-gray-400 transition hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-600"
        :title="$t('folder.rename')"
      >
        <IconsEdit class="w-4" />
      </button>
    </template>
    <template #title>{{ $t('folder.rename') }}</template>
    <template #description>
      <div class="flex flex-col">
        <FormTextField
          id="folderPath"
          v-model="target"
          :label="$t('folder.path')"
          :description="$t('folder.pathDesc')"
        />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton>{{ $t('dialog.cancel') }}</BaseSecondaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BasePrimaryButton @click="rename">
          {{ $t('folder.rename') }}
        </BasePrimaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
const props = defineProps<{ path: string }>();

const target = ref(props.path);
const clientsStore = useClientsStore();

const { t } = useI18n();

function resetOnOpen(open: boolean) {
  if (!open) return;

  target.value = props.path;
}

function rename() {
  if (target.value === props.path) return;

  return _renameFolder({ from: props.path, to: target.value });
}

const _renameFolder = useSubmit(
  (data) =>
    $fetch('/api/folder/rename', {
      method: 'post',
      body: data,
    }),
  {
    revert: () => clientsStore.refresh(),
    successMsg: t('folder.renamed'),
  }
);
</script>
