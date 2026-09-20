export type FolderNode = {
  /** last segment of the path */
  name: string;
  /** full slash separated path */
  path: string;
  depth: number;
  /** clients sitting directly in this folder */
  clientCount: number;
  /** clients in this folder and every descendant */
  totalClientCount: number;
  /** enabled clients in this folder and every descendant */
  enabledClientCount: number;
  children: FolderNode[];
};

/** deeper folders still work, the UI only warns about them */
export const FOLDER_DEPTH_WARNING = 5;

/** a folder path belongs to a branch when it is the branch itself or sits below it */
export function inBranch(folder: string, branch: string) {
  return folder === branch || folder.startsWith(`${branch}/`);
}

/**
 * Folders are not stored anywhere, they are derived from the paths clients carry.
 * A folder therefore stops existing as soon as its last client leaves it.
 */
export function buildFolderTree(
  clients: { folder: string | null; enabled: boolean }[]
) {
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

  for (const client of clients) {
    if (client.folder === null) {
      continue;
    }

    ensure(client.folder).clientCount++;

    const segments = client.folder.split('/');
    for (let i = 1; i <= segments.length; i++) {
      const ancestor = nodes.get(segments.slice(0, i).join('/'))!;
      ancestor.totalClientCount++;
      if (client.enabled) {
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
