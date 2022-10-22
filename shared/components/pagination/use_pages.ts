import { useMemo } from 'react';
import { PageItem } from './constants';
import e, { EventType } from './eventemitter';

const ELLIPSIS_TEXT = '...';

export default ({
  id,
  page,
  totalPage,
  onChange,
}: {
  id: string;
  page: number;
  totalPage: number;
  onChange: (page: number) => void;
}) => {
  const pages = useMemo<PageItem[]>(() => {
    const ps: PageItem[] = [
      {
        text: 1,
        active: page === 1,
        onClick: () => onChange(1),
      },
    ];

    if (page > 3) {
      ps.push(
        {
          text: ELLIPSIS_TEXT,
          onClick: () => e.emit(EventType.OPEN_CUSTOM_PAGE, id),
        },
        {
          text: page - 1,
          onClick: () => onChange(page - 1),
        },
        {
          text: page,
          active: true,
          onClick: () => onChange(page),
        },
      );
    } else if (page === 2) {
      ps.push({
        text: 2,
        active: true,
        onClick: () => onChange(2),
      });
    } else if (page === 3) {
      ps.push(
        {
          text: 2,
          onClick: () => onChange(2),
        },
        {
          text: 3,
          active: true,
          onClick: () => onChange(3),
        },
      );
    }

    const offset = totalPage - page;
    if (offset >= 3) {
      ps.push(
        {
          text: page + 1,
          onClick: () => onChange(page + 1),
        },
        {
          text: ELLIPSIS_TEXT,
          onClick: () => e.emit(EventType.OPEN_CUSTOM_PAGE, id),
        },
        {
          text: totalPage,
          onClick: () => onChange(totalPage),
        },
      );
    } else if (offset === 2) {
      ps.push(
        {
          text: page + 1,
          onClick: () => onChange(page + 1),
        },
        {
          text: page + 2,
          onClick: () => onChange(page + 2),
        },
      );
    } else if (offset === 1) {
      ps.push({
        text: page + 1,
        onClick: () => onChange(page + 1),
      });
    }

    return ps;
  }, [id, onChange, page, totalPage]);

  return pages;
};
