import z from 'zod';

import { UserCreateSchema } from './types';

import { FolderPathSchema } from '#db/repositories/client/types';
import { t } from '#server/utils/types';

const deviceName = z
  .string({ message: t('zod.onboarding.deviceName') })
  .min(1, t('zod.onboarding.deviceName'))
  .max(64, t('zod.onboarding.deviceName'));

export const OnboardingSchema = UserCreateSchema.extend({
  folder: FolderPathSchema,
  devices: z
    .array(deviceName, { message: t('zod.onboarding.devices') })
    .min(1, t('zod.onboarding.devices'))
    .max(20, t('zod.onboarding.devices')),
});

export type OnboardingType = z.infer<typeof OnboardingSchema>;
