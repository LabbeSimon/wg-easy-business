import { readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import WireGuard from '#server/utils/WireGuard';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { FolderToggleSchema } from '#db/repositories/folder/types';

export default definePermissionEventHandler(
  'folders',
  'manage',
  async ({ event }) => {
    const { path, enabled } = await readValidatedBody(
      event,
      validateZod(FolderToggleSchema, event)
    );

    const changed = await Database.folders.setEnabled(path, enabled);

    if (changed > 0) {
      await WireGuard.saveConfig();
    }

    return { success: true, changed };
  }
);
