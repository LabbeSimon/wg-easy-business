<template>
  <BaseDialog :trigger-class="triggerClass" @update:open="resetOnOpen">
    <template #trigger>
      <slot />
    </template>
    <template #title>
      {{ $t('client.new') }}
    </template>
    <template #description>
      <div class="flex flex-col">
        <FormTextField id="name" v-model="name" :label="$t('client.name')" />
        <FormNullTextField
          id="folder"
          v-model="folder"
          :label="$t('folder.path')"
          :description="$t('folder.pathDesc')"
          placeholder="Client A/Site Paris"
        />
        <template v-if="owners.length > 1">
          <FormLabel for="owner">{{ $t('client.owner') }}</FormLabel>
          <BaseSelect id="owner" v-model="owner" :options="owners" />
        </template>
        <FormDateField
          id="expiresAt"
          v-model="expiresAt"
          :label="$t('client.expireDate')"
        />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton>{{ $t('dialog.cancel') }}</BaseSecondaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BasePrimaryButton @click="createClient">
          {{ $t('client.create') }}
        </BasePrimaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
const name = ref<string>('');
const folder = ref<string | null>(null);
const owner = ref<string | undefined>(undefined);
const expiresAt = ref<string | null>(null);
const clientsStore = useClientsStore();
const authStore = useAuthStore();

const { t } = useI18n();

defineProps<{ triggerClass?: string }>();

const isAdmin = computed(
  () =>
    authStore.userData !== null &&
    hasPermissions(authStore.userData, 'admin', 'any')
);

// only an admin may hand a device to somebody else, so nobody else fetches the list
const { data: users } = await useFetch('/api/admin/users', {
  method: 'get',
  immediate: isAdmin.value,
  default: () => [],
});

const owners = computed(() =>
  (users.value ?? []).map((user) => ({
    label: user.name,
    value: String(user.id),
  }))
);

function resetOnOpen(open: boolean) {
  if (!open) return;

  name.value = '';
  folder.value = null;
  owner.value = undefined;
  expiresAt.value = null;
}

function createClient() {
  return _createClient({
    name: name.value,
    folder: folder.value,
    expiresAt: expiresAt.value,
    userId: owner.value === undefined ? undefined : Number(owner.value),
  });
}

const _createClient = useSubmit(
  (data) =>
    $fetch('/api/client', {
      method: 'post',
      body: data,
    }),
  {
    revert: () => clientsStore.refresh(),
    successMsg: t('client.created'),
  }
);
</script>
