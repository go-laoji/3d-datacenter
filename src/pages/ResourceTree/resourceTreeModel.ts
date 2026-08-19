import type { ResourceTreeItem } from '@/services/idc/resourceTree';

export interface ResourceTreeBranch {
  item: ResourceTreeItem;
  children: ResourceTreeBranch[];
}

export const buildResourceTree = (
  items: ResourceTreeItem[],
): ResourceTreeBranch[] => {
  const byId = new Map(
    items.map((item) => [
      item.id,
      { item, children: [] as ResourceTreeBranch[] },
    ]),
  );
  const roots: ResourceTreeBranch[] = [];
  byId.forEach((branch) => {
    const parent = branch.item.parentId
      ? byId.get(branch.item.parentId)
      : undefined;
    if (parent) parent.children.push(branch);
    else roots.push(branch);
  });
  const sort = (branches: ResourceTreeBranch[]) => {
    branches.sort(
      (a, b) =>
        b.item.alertCount - a.item.alertCount ||
        a.item.name.localeCompare(b.item.name, 'zh-CN'),
    );
    branches.forEach((branch) => {
      sort(branch.children);
    });
  };
  sort(roots);
  return roots;
};

export const filterResourceIndex = (
  items: ResourceTreeItem[],
  keyword: string,
  anomaliesOnly = false,
) => {
  const normalized = keyword.trim().toLowerCase();
  return items
    .filter((item) => !anomaliesOnly || item.status !== 'normal')
    .filter(
      (item) =>
        !normalized ||
        [item.name, item.code, item.subtitle, ...item.keywords].some((value) =>
          value?.toLowerCase().includes(normalized),
        ),
    )
    .sort(
      (a, b) =>
        b.alertCount - a.alertCount || a.name.localeCompare(b.name, 'zh-CN'),
    );
};

export const getAncestorIds = (itemId: string, items: ResourceTreeItem[]) => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const result: string[] = [];
  let current = byId.get(itemId);
  while (current?.parentId) {
    result.unshift(current.parentId);
    current = byId.get(current.parentId);
  }
  return result;
};
