import { createError, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import WireGuard from '#server/utils/WireGuard';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { OnboardingSchema } from '#db/repositories/user/onboarding';

/**
 * Enrolling somebody is one action: the account and all of their devices at once.
 */
export default definePermissionEventHandler(
  'admin',
  'any',
  async ({ event }) => {
    const { folder, devices, ...user } = await readValidatedBody(
      event,
      validateZod(OnboardingSchema, event)
    );

    let userId: number;
    try {
      userId = await Database.users.createByAdmin(user);
    } catch (e) {
      throw createError({
        statusCode: 409,
        statusMessage: e instanceof Error ? e.message : 'Could not create user',
      });
    }

    const created = [];
    for (const name of devices) {
      const result = await Database.clients.create({
        name,
        folder,
        expiresAt: null,
        userId,
      });
      created.push({ id: result[0]!.clientId, name });
    }

    await WireGuard.saveConfig();

    return { success: true, userId, folder, devices: created };
  }
);
