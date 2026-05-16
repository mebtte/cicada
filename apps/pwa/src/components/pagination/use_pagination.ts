import { useMemo } from 'react';

export type PaginationItem =
  | { kind: 'previous'; disabled: boolean }
  | { kind: 'next'; disabled: boolean }
  | { kind: 'first'; disabled: boolean }
  | { kind: 'last'; disabled: boolean }
  | { kind: 'page'; page: number; selected: boolean }
  | { kind: 'start-ellipsis' }
  | { kind: 'end-ellipsis' };

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

export default function usePagination({
  count,
  page,
  siblingCount,
  boundaryCount,
  showFirstButton,
  showLastButton,
}: {
  count: number;
  page: number;
  siblingCount: number;
  boundaryCount: number;
  showFirstButton: boolean;
  showLastButton: boolean;
}): PaginationItem[] {
  return useMemo(() => {
    if (count <= 0) {
      return [];
    }

    const startPages = range(1, Math.min(boundaryCount, count));
    const endPages = range(
      Math.max(count - boundaryCount + 1, boundaryCount + 1),
      count,
    );

    const siblingsStart = Math.max(
      Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
      boundaryCount + 2,
    );
    const siblingsEnd = Math.min(
      Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
      endPages.length > 0 ? endPages[0] - 2 : count - 1,
    );

    const items: PaginationItem[] = [];

    if (showFirstButton) {
      items.push({ kind: 'first', disabled: page <= 1 });
    }
    items.push({ kind: 'previous', disabled: page <= 1 });

    for (const p of startPages) {
      items.push({ kind: 'page', page: p, selected: p === page });
    }

    if (siblingsStart > boundaryCount + 2) {
      items.push({ kind: 'start-ellipsis' });
    } else if (boundaryCount + 1 < count - boundaryCount) {
      items.push({
        kind: 'page',
        page: boundaryCount + 1,
        selected: page === boundaryCount + 1,
      });
    }

    for (const p of range(siblingsStart, siblingsEnd)) {
      items.push({ kind: 'page', page: p, selected: p === page });
    }

    if (siblingsEnd < count - boundaryCount - 1) {
      items.push({ kind: 'end-ellipsis' });
    } else if (count - boundaryCount > boundaryCount) {
      items.push({
        kind: 'page',
        page: count - boundaryCount,
        selected: page === count - boundaryCount,
      });
    }

    for (const p of endPages) {
      items.push({ kind: 'page', page: p, selected: p === page });
    }

    items.push({ kind: 'next', disabled: page >= count });
    if (showLastButton) {
      items.push({ kind: 'last', disabled: page >= count });
    }

    return items;
  }, [count, page, siblingCount, boundaryCount, showFirstButton, showLastButton]);
}
