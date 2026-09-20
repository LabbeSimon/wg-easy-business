<template>
  <BaseDialog @update:open="resetOnOpen">
    <template #trigger>
      <slot />
    </template>
    <template #title>{{ $t('admin.users.create') }}</template>
    <template #description>
      <div class="flex flex-col">
        <FormTextField
          id="userName"
          v-model="form.name"
          :label="$t('admin.users.name')"
        />
        <FormTextField
          id="userUsername"
          v-model="form.username"
          :label="$t('admin.users.username')"
        />
        <FormPasswordField
          id="userPassword"
          v-model="form.password"
          :label="$t('admin.users.password')"
          autocomplete="new-password"
        />
        <FormNullTextField
          id="userEmail"
          v-model="form.email"
          :label="$t('admin.users.email')"
        />
        <FormSwitchField
          id="userAdmin"
          v-model="isAdmin"
          :label="$t('admin.users.roleAdmin')"
          :description="$t('admin.users.roleAdminDesc')"
        />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton>{{ $t('dialog.cancel') }}</BaseSecondaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BasePrimaryButton @click="create">
          {{ $t('admin.users.create') }}
        </BasePrimaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
import { roles } from '#shared/utils/permissions';

const emit = defineEmits<{ created: [] }>();

const { t } = useI18n();

function emptyForm() {
  return {
    name: '',
    username: '',
    password: '',
    email: null as string | null,
  };
}

const form = ref(emptyForm());
const isAdmin = ref(false);

function resetOnOpen(open: boolean) {
  if (!open) return;

  form.value = emptyForm();
  isAdmin.value = false;
}

function create() {
  return _createUser({
    ...form.value,
    role: isAdmin.value ? roles.ADMIN : roles.CLIENT,
  });
}

const _createUser = useSubmit(
  (data) =>
    $fetch('/api/admin/users', {
      method: 'post',
      body: data,
    }),
  {
    revert: () => {
      emit('created');
      return Promise.resolve();
    },
    successMsg: t('admin.users.created'),
  }
);
</script>
