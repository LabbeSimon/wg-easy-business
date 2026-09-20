import { getValidatedRouterParams, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { ClientGetSchema } from '#db/repositories/client/types';
import { ClientFolderSchema } from '#db/repositories/folder/types';

export default definePermissionEventHandler(
  'folders',
  'manage',
  async ({ event }) => {
    const { clientId } = await getValidatedRouterParams(
      event,
      validateZod(ClientGetSchema, event)
    );

    const { folder } = await readValidatedBody(
      event,
      validateZod(ClientFolderSchema, event)
    );

    await Database.clients.setFolder(clientId, folder);

    return { success: true };
  }
);
