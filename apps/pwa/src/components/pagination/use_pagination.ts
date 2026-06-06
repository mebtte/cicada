import { useMemo } from 'react';

export type PaginationItem =
  | { kind: 'previous'; disabled: boolean }
  | { kind: 'next'; disabled: boolean }
  | { kind: 'page'; page: number; selected: boolean }
  | { kind: 'start-ellipsis' }
  | { kind: 'end-ellipsis' };

const BOUNDARY_COUNT = 1;

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

export default function usePagination({
  count,
  page,
  siblingCount,
}: {
  count: number;
  page: number;
  siblingCount: number;
}): PaginationItem[] {
  return useMemo(() => {
    if (count <= 0) {
      return [];
    }

    const startPages = range(1, Math.min(BOUNDARY_COUNT, count));
    const endPages = range(
      Math.max(count - BOUNDARY_COUNT + 1, BOUNDARY_COUNT + 1),
      count,
    );

    const siblingsStart = Math.max(
      Math.min(
        page - siblingCount,
        count - BOUNDARY_COUNT - siblingCount * 2 - 1,
      ),
      BOUNDARY_COUNT + 2,
    );
    const siblingsEnd = Math.min(
      Math.max(page + siblingCount, BOUNDARY_COUNT + siblingCount * 2 + 2),
      endPages.length > 0 ? endPages[0] - 2 : count - 1,
    );

    const items: PaginationItem[] = [];

    items.push({ kind: 'previous', disabled: page <= 1 });

    for (const p of startPages) {
      items.push({ kind: 'page', page: p, selected: p === page });
    }

    if (siblingsStart > BOUNDARY_COUNT + 2) {
      items.push({ kind: 'start-ellipsis' });
    } else if (BOUNDARY_COUNT + 1 < count - BOUNDARY_COUNT) {
      items.push({
        kind: 'page',
        page: BOUNDARY_COUNT + 1,
        selected: page === BOUNDARY_COUNT + 1,
      });
    }

    for (const p of range(siblingsStart, siblingsEnd)) {
      items.push({ kind: 'page', page: p, selected: p === page });
    }

    if (siblingsEnd < count - BOUNDARY_COUNT - 1) {
      items.push({ kind: 'end-ellipsis' });
    } else if (count - BOUNDARY_COUNT > BOUNDARY_COUNT) {
      items.push({
        kind: 'page',
        page: count - BOUNDARY_COUNT,
        selected: page === count - BOUNDARY_COUNT,
      });
    }

    for (const p of endPages) {
      items.push({ kind: 'page', page: p, selected: p === page });
    }

    items.push({ kind: 'next', disabled: page >= count });

    return items;
  }, [count, page, siblingCount]);
}
