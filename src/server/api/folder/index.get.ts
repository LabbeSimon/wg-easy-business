import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { roles } from '#shared/utils/permissions';

export default definePermissionEventHandler(
  'folders',
  'view',
  async ({ user }) => {
    if (user.role === roles.ADMIN) {
      return Database.folders.getTree();
    }
    return Database.folders.getTree(user.id);
  }
);
