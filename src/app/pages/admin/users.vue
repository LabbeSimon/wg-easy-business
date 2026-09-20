<template>
  <main class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <p class="whitespace-pre-line">{{ $t('admin.users.introText') }}</p>
      <AdminUserCreateDialog @created="refresh">
        <BaseSecondaryButton as="span">
          <IconsPlus class="mr-2 w-4" />
          <span class="text-sm">{{ $t('admin.users.create') }}</span>
        </BaseSecondaryButton>
      </AdminUserCreateDialog>
    </div>

    <ul class="flex flex-col divide-y divide-gray-100 dark:divide-neutral-600">
      <li
        v-for="user in users"
        :key="user.id"
        class="flex flex-wrap items-center gap-3 py-3"
        :class="{ 'opacity-50': !user.enabled }"
      >
        <div class="flex min-w-48 flex-grow flex-col">
          <span class="text-sm">
            {{ user.name }}
            <span v-if="user.id === me" class="text-xs text-gray-400">
              ({{ $t('admin.users.you') }})
            </span>
          </span>
          <span class="text-xs text-gray-400 dark:text-neutral-400">
            {{ user.username }}
            <template v-if="user.email"> · {{ user.email }}</template>
          </span>
        </div>

        <span class="text-xs text-gray-400 dark:text-neutral-400">
          {{
            user.role === roles.ADMIN
              ? $t('admin.users.roleAdmin')
              : $t('admin.users.roleClient')
          }}
        </span>

        <span class="text-xs text-gray-400 dark:text-neutral-400">
          {{
            $t('admin.users.deviceCount', {
              enabled: user.enabledDeviceCount,
              total: user.deviceCount,
            })
          }}
        </span>

        <div class="ml-auto flex items-center gap-2">
          <BaseSwitch
            :model-value="user.enabled"
            :title="
              user.enabled
                ? $t('admin.users.offboard')
                : $t('admin.users.onboardBack')
            "
            :disabled="user.id === me"
            @update:model-value="(value) => toggle(user.id, value)"
          />
          <AdminUserDeleteDialog
            v-if="user.id !== me"
            :user-name="user.name"
            :device-count="user.deviceCount"
            @delete="remove(user.id)"
          >
            <button
              type="button"
              class="rounded bg-gray-100 p-2 align-middle transition hover:bg-red-800 hover:text-white dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
              :title="$t('admin.users.delete')"
            >
              <IconsDelete class="w-5" />
            </button>
          </AdminUserDeleteDialog>
        </div>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { roles } from '#shared/utils/permissions';

const { t } = useI18n();

const authStore = useAuthStore();
const me = computed(() => authStore.userData?.id);

const { data: users, refresh } = await useFetch('/api/admin/users', {
  method: 'get',
  default: () => [],
});

const _toggleUser = useSubmit(
  (data) =>
    $fetch(`/api/admin/users/${data!.id}/toggle`, {
      method: 'post',
      body: { enabled: data!.enabled },
    }),
  {
    revert: () => refresh(),
    noSuccessToast: true,
  }
);

function toggle(id: number, enabled: boolean | undefined) {
  if (enabled === undefined) return;

  return _toggleUser({ id, enabled });
}

const _deleteUser = useSubmit(
  (data) =>
    $fetch(`/api/admin/users/${data!.id}`, {
      method: 'delete',
    }),
  {
    revert: () => refresh(),
    successMsg: t('admin.users.deleted'),
  }
);

function remove(id: number) {
  return _deleteUser({ id });
}
</script>
