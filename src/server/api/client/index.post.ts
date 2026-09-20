import { createError, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import WireGuard from '#server/utils/WireGuard';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { roles } from '#shared/utils/permissions';
import { ClientCreateSchema } from '#db/repositories/client/types';

export default definePermissionEventHandler(
  'clients',
  'create',
  async ({ event, user }) => {
    const { name, expiresAt, folder, userId } = await readValidatedBody(
      event,
      validateZod(ClientCreateSchema, event)
    );

    // only an admin may hand a device to somebody else
    const owner = user.role === roles.ADMIN ? (userId ?? user.id) : user.id;

    if (owner !== user.id) {
      const ownerUser = await Database.users.get(owner);
      if (!ownerUser) {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found',
        });
      }
    }

    const result = await Database.clients.create({
      name,
      expiresAt,
      folder,
      userId: owner,
    });
    await WireGuard.saveConfig();

    const clientId = result[0]!.clientId;
    return { success: true, clientId };
  }
);
