import { readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { FolderRenameSchema } from '#db/repositories/folder/types';

export default definePermissionEventHandler(
  'folders',
  'manage',
  async ({ event }) => {
    const { from, to } = await readValidatedBody(
      event,
      validateZod(FolderRenameSchema, event)
    );

    const moved = await Database.folders.rename(from, to);

    return { success: true, moved };
  }
);
