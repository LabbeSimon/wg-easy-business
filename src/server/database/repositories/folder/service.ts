import { and, eq, inArray, isNotNull } from 'drizzle-orm';

import { client } from '../client/schema';
import { FOLDER_PATH_MAX_LENGTH } from '../client/types';

import type { FolderNode } from './types';

import type { DBType } from '#db/sqlite';
import type { ID } from '#server/utils/types';

/** a folder path belongs to a branch when it is the branch itself or sits below it */
function inBranch(folder: string, branch: string) {
  return folder === branch || folder.startsWith(`${branch}/`);
}

function isExpired(expiresAt: string | null) {
  return expiresAt !== null && new Date() > new Date(expiresAt);
}

export class FolderService {
  #db: DBType;

  constructor(db: DBType) {
    this.#db = db;
  }

  #foldered(userId?: ID) {
    return this.#db
      .select({
        id: client.id,
        folder: client.folder,
        enabled: client.enabled,
        expiresAt: client.expiresAt,
      })
      .from(client)
      .where(
        userId === undefined
          ? isNotNull(client.folder)
          : and(isNotNull(client.folder), eq(client.userId, userId))
      )
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
   * Folders are not stored, they are derived from the paths clients carry.
   * A folder therefore stops existing as soon as its last client leaves it.
   */
  async getTree(userId?: ID) {
    const rows = await this.#foldered(userId);
    const nodes = new Map<string, FolderNode>();

    const ensure = (path: string): FolderNode => {
      const existing = nodes.get(path);
      if (existing) {
        return existing;
      }

      const segments = path.split('/');
      const node: FolderNode = {
        name: segments[segments.length - 1]!,
        path,
        depth: segments.length,
        clientCount: 0,
        totalClientCount: 0,
        enabledClientCount: 0,
        children: [],
      };
      nodes.set(path, node);

      if (segments.length > 1) {
        ensure(segments.slice(0, -1).join('/')).children.push(node);
      }

      return node;
    };

    for (const row of rows) {
      ensure(row.folder).clientCount++;

      const segments = row.folder.split('/');
      for (let i = 1; i <= segments.length; i++) {
        const ancestor = nodes.get(segments.slice(0, i).join('/'))!;
        ancestor.totalClientCount++;
        if (row.enabled) {
          ancestor.enabledClientCount++;
        }
      }
    }

    const sortTree = (list: FolderNode[]): FolderNode[] =>
      list
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((node) => ({ ...node, children: sortTree(node.children) }));

    return sortTree(
      Array.from(nodes.values()).filter((node) => node.depth === 1)
    );
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
