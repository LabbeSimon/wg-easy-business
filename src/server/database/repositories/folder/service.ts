import { inArray, isNotNull } from 'drizzle-orm';

import { client } from '../client/schema';
import { FOLDER_PATH_MAX_LENGTH } from '../client/types';

import type { DBType } from '#db/sqlite';
import type { ID } from '#server/utils/types';
import { inBranch } from '#shared/utils/folders';

function isExpired(expiresAt: string | null) {
  return expiresAt !== null && new Date() > new Date(expiresAt);
}

/**
 * Folders have no table of their own, they are a path carried by each client.
 * This service only holds the bulk operations that act on a whole branch.
 */
export class FolderService {
  #db: DBType;

  constructor(db: DBType) {
    this.#db = db;
  }

  #foldered() {
    return this.#db
      .select({
        id: client.id,
        folder: client.folder,
        enabled: client.enabled,
        expiresAt: client.expiresAt,
      })
      .from(client)
      .where(isNotNull(client.folder))
      .execute() as Promise<
      {
        id: ID;
        folder: string;
        enabled: boolean;
        expiresAt: string | null;
      }[]
    >;
  }

  /**
   * Toggles every client of a branch at once. Expired clients are left alone,
   * enabling them would be undone by the next cron run anyway.
   */
  async setEnabled(path: string, enabled: boolean) {
    const rows = await this.#foldered();
    const ids = rows
      .filter(
        (row) =>
          inBranch(row.folder, path) &&
          row.enabled !== enabled &&
          !(enabled && isExpired(row.expiresAt))
      )
      .map((row) => row.id);

    if (ids.length === 0) {
      return 0;
    }

    await this.#db
      .update(client)
      .set({ enabled })
      .where(inArray(client.id, ids))
      .execute();

    return ids.length;
  }

  /**
   * Renaming or moving a folder rewrites the path prefix of every client below it.
   */
  async rename(from: string, to: string) {
    const rows = await this.#foldered();
    const moved = rows
      .filter((row) => inBranch(row.folder, from))
      .map((row) => ({
        id: row.id,
        folder: to + row.folder.slice(from.length),
      }));

    if (moved.length === 0) {
      return 0;
    }

    const tooLong = moved.find(
      (row) => row.folder.length > FOLDER_PATH_MAX_LENGTH
    );
    if (tooLong) {
      throw new Error(`Resulting path is too long: ${tooLong.folder}`);
    }

    const byFolder = new Map<string, ID[]>();
    for (const row of moved) {
      const ids = byFolder.get(row.folder) ?? [];
      ids.push(row.id);
      byFolder.set(row.folder, ids);
    }

    await this.#db.transaction(async (tx) => {
      for (const [folder, ids] of byFolder) {
        await tx
          .update(client)
          .set({ folder })
          .where(inArray(client.id, ids))
          .execute();
      }
    });

    return moved.length;
  }
}
