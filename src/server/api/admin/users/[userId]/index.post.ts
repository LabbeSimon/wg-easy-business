import { createError, getValidatedRouterParams, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import {
  UserAdminUpdateSchema,
  UserGetSchema,
} from '#db/repositories/user/types';

export default definePermissionEventHandler(
  'admin',
  'any',
  async ({ event }) => {
    const { userId } = await getValidatedRouterParams(
      event,
      validateZod(UserGetSchema, event)
    );

    const data = await readValidatedBody(
      event,
      validateZod(UserAdminUpdateSchema, event)
    );

    try {
      await Database.users.updateByAdmin(userId, data);
    } catch (e) {
      throw createError({
        statusCode: 409,
        statusMessage: e instanceof Error ? e.message : 'Could not update user',
      });
    }

    return { success: true };
  }
);
