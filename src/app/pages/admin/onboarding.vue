<template>
  <main>
    <p class="whitespace-pre-line pb-4">
      {{ $t('admin.onboarding.introText') }}
    </p>

    <FormElement v-if="result === null" @submit.prevent="submit">
      <FormGroup>
        <FormHeading>{{ $t('admin.onboarding.person') }}</FormHeading>
        <FormTextField
          id="name"
          v-model="form.name"
          :label="$t('admin.users.name')"
        />
        <FormTextField
          id="username"
          v-model="form.username"
          :label="$t('admin.users.username')"
        />
        <FormPasswordField
          id="password"
          v-model="form.password"
          :label="$t('admin.users.password')"
          autocomplete="new-password"
        />
        <FormNullTextField
          id="email"
          v-model="form.email"
          :label="$t('admin.users.email')"
        />
      </FormGroup>

      <FormGroup>
        <FormHeading :description="$t('folder.pathDesc')">
          {{ $t('admin.onboarding.devices') }}
        </FormHeading>
        <FormNullTextField
          id="folder"
          v-model="form.folder"
          :label="$t('folder.path')"
          placeholder="Client A/Paris"
        />
        <FormLabel for="devices">{{
          $t('admin.onboarding.deviceList')
        }}</FormLabel>
        <FormArrayField v-model="form.devices" name="devices" />
      </FormGroup>

      <FormGroup>
        <FormHeading>{{ $t('form.actions') }}</FormHeading>
        <FormPrimaryActionField
          type="submit"
          :label="$t('admin.onboarding.submit')"
        />
      </FormGroup>
    </FormElement>

    <div v-else class="flex flex-col gap-4">
      <p>
        {{
          $t('admin.onboarding.doneText', {
            name: result.name,
            count: result.devices.length,
          })
        }}
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="device in result.devices"
          :key="device.id"
          class="rounded bg-gray-100 px-3 py-2 dark:bg-neutral-600"
        >
          <NuxtLink :to="`/clients/${device.id}`" class="hover:underline">
            {{ device.name }}
          </NuxtLink>
        </li>
      </ul>
      <div class="flex gap-2">
        <NuxtLink to="/">
          <BasePrimaryButton>
            {{ $t('admin.onboarding.viewDevices') }}
          </BasePrimaryButton>
        </NuxtLink>
        <BaseSecondaryButton @click="reset">
          {{ $t('admin.onboarding.another') }}
        </BaseSecondaryButton>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { roles } from '#shared/utils/permissions';

const { t } = useI18n();

function emptyForm() {
  return {
    name: '',
    username: '',
    password: '',
    email: null as string | null,
    role: roles.CLIENT as number,
    folder: null as string | null,
    devices: [t('admin.onboarding.laptop'), t('admin.onboarding.phone')],
  };
}

const form = ref(emptyForm());
const result = ref<{
  name: string;
  devices: { id: number; name: string }[];
} | null>(null);

function reset() {
  form.value = emptyForm();
  result.value = null;
}

function submit() {
  return _onboard({ ...form.value });
}

const _onboard = useSubmit(
  (data) =>
    $fetch('/api/admin/onboarding', {
      method: 'post',
      body: data,
    }),
  {
    revert: async (success, data) => {
      if (success && data) {
        result.value = { name: form.value.name, devices: data.devices };
      }
    },
    successMsg: t('admin.onboarding.done'),
  }
);
</script>
