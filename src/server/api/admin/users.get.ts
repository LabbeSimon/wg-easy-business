import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';

export default definePermissionEventHandler('admin', 'any', async () => {
  const users = await Database.users.getAll();

  // never leak password hashes or totp secrets to the owner picker
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    enabled: user.enabled,
  }));
});
