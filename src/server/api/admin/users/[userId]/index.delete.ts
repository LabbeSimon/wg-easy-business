import { createError, getValidatedRouterParams } from 'h3';

import Database from '#server/utils/Database';
import WireGuard from '#server/utils/WireGuard';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { UserGetSchema } from '#db/repositories/user/types';

export default definePermissionEventHandler(
  'admin',
  'any',
  async ({ event, user }) => {
    const { userId } = await getValidatedRouterParams(
      event,
      validateZod(UserGetSchema, event)
    );

    if (userId === user.id) {
      throw createError({
        statusCode: 422,
        statusMessage: 'You cannot delete your own account',
      });
    }

    try {
      await Database.users.delete(userId);
    } catch (e) {
      throw createError({
        statusCode: 409,
        statusMessage: e instanceof Error ? e.message : 'Could not delete user',
      });
    }

    await WireGuard.saveConfig();

    return { success: true };
  }
);
