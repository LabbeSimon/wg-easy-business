import { createError, getValidatedRouterParams, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import WireGuard from '#server/utils/WireGuard';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { UserGetSchema, UserToggleSchema } from '#db/repositories/user/types';

/**
 * Offboarding in one click: the account stops working and every device it owns
 * drops out of the WireGuard config, whichever folder they sit in.
 */
export default definePermissionEventHandler(
  'admin',
  'any',
  async ({ event, user }) => {
    const { userId } = await getValidatedRouterParams(
      event,
      validateZod(UserGetSchema, event)
    );

    const { enabled } = await readValidatedBody(
      event,
      validateZod(UserToggleSchema, event)
    );

    if (userId === user.id && !enabled) {
      throw createError({
        statusCode: 422,
        statusMessage: 'You cannot disable your own account',
      });
    }

    try {
      await Database.users.setEnabled(userId, enabled);
    } catch (e) {
      throw createError({
        statusCode: 409,
        statusMessage: e instanceof Error ? e.message : 'Could not update user',
      });
    }

    const changed = await Database.folders.setEnabledForUser(userId, enabled);

    if (changed > 0) {
      await WireGuard.saveConfig();
    }

    return { success: true, changed };
  }
);
