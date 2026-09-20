import { createError, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { UserCreateSchema } from '#db/repositories/user/types';

export default definePermissionEventHandler(
  'admin',
  'any',
  async ({ event }) => {
    const data = await readValidatedBody(
      event,
      validateZod(UserCreateSchema, event)
    );

    try {
      const userId = await Database.users.createByAdmin(data);
      return { success: true, userId };
    } catch (e) {
      throw createError({
        statusCode: 409,
        statusMessage: e instanceof Error ? e.message : 'Could not create user',
      });
    }
  }
);
