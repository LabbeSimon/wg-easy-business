import { describe, expect, test } from 'vitest';

import { buildFolderTree, inBranch } from '#shared/utils/folders';

function client(folder: string | null, enabled = true) {
  return { folder, enabled };
}

describe('inBranch', () => {
  test('matches the branch itself and its descendants', () => {
    expect(inBranch('A', 'A')).toBe(true);
    expect(inBranch('A/B', 'A')).toBe(true);
    expect(inBranch('A/B/C', 'A/B')).toBe(true);
  });

  test('does not match siblings sharing a prefix', () => {
    expect(inBranch('AB', 'A')).toBe(false);
    expect(inBranch('A/BC', 'A/B')).toBe(false);
    expect(inBranch('A', 'A/B')).toBe(false);
  });
});

describe('buildFolderTree', () => {
  test('ignores clients left at the root', () => {
    expect(buildFolderTree([client(null), client(null)])).toEqual([]);
  });

  test('creates the ancestors a deep path implies', () => {
    const tree = buildFolderTree([client('A/B/C')]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.path).toBe('A');
    expect(tree[0]!.children[0]!.path).toBe('A/B');
    expect(tree[0]!.children[0]!.children[0]!.path).toBe('A/B/C');
  });

  test('counts direct clients apart from the whole branch', () => {
    const tree = buildFolderTree([client('A'), client('A/B'), client('A/B/C')]);

    const a = tree[0]!;
    expect(a.clientCount).toBe(1);
    expect(a.totalClientCount).toBe(3);

    const b = a.children[0]!;
    expect(b.clientCount).toBe(1);
    expect(b.totalClientCount).toBe(2);
  });

  test('counts enabled clients across the whole branch', () => {
    const tree = buildFolderTree([
      client('A', true),
      client('A/B', false),
      client('A/B', false),
    ]);

    const a = tree[0]!;
    expect(a.enabledClientCount).toBe(1);
    expect(a.totalClientCount).toBe(3);

    // a fully disabled branch is what drives the folder switch to off
    expect(a.children[0]!.enabledClientCount).toBe(0);
  });

  test('keeps sibling folders separate and sorted', () => {
    const tree = buildFolderTree([client('B'), client('A'), client('AB')]);

    expect(tree.map((node) => node.name)).toEqual(['A', 'AB', 'B']);
    expect(tree.every((node) => node.totalClientCount === 1)).toBe(true);
  });

  test('reports the depth used to warn about deep nesting', () => {
    const tree = buildFolderTree([client('A/B/C/D/E/F')]);

    let node = tree[0]!;
    const depths = [node.depth];
    while (node.children.length > 0) {
      node = node.children[0]!;
      depths.push(node.depth);
    }

    expect(depths).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
