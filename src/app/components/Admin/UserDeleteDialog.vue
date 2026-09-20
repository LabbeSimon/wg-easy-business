<template>
  <BaseDialog>
    <template #trigger><slot /></template>
    <template #title>{{ $t('admin.users.delete') }}</template>
    <template #description>
      <i18n-t keypath="admin.users.deleteDialog" tag="p">
        <template #name>
          <strong>{{ userName }}</strong>
        </template>
        <template #count>
          <strong>{{ deviceCount }}</strong>
        </template>
      </i18n-t>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BasePrimaryButton>{{ $t('dialog.cancel') }}</BasePrimaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BaseSecondaryButton @click="$emit('delete')">
          {{ $t('admin.users.delete') }}
        </BaseSecondaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
defineEmits(['delete']);
defineProps<{ userName: string; deviceCount: number }>();
</script>
