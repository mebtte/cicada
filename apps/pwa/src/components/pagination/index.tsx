import { HtmlHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import Button, { Size } from '@/components/button';
import usePagination from './use_pagination';
import { t } from '@/i18n';
import { ChevronLeft, ChevronRight, MoreHorizontal } from '@/components/icon';

const GAP_MAP: Record<Size, number> = { sm: 5, md: 6, lg: 8 };
const PAGINATION_SIZE: Size = 'sm';
const ELLIPSIS_SIZE: Record<Size, { box: number; icon: number }> = {
  sm: { box: 34, icon: 18 },
  md: { box: 44, icon: 22 },
  lg: { box: 54, icon: 26 },
};

const Style = styled.div<{ $gap: number }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $gap }) => $gap}px;
`;
const PageButton = styled(Button)<{ $size: Size }>`
  min-width: ${({ $size }) => ELLIPSIS_SIZE[$size].box}px;
  line-height: 1;

  > .btn-label {
    line-height: 1;
  }
`;
const Ellipsis = styled.span<{ $size: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgb(155 155 155);
  user-select: none;
  ${({ $size }) => {
    const { box, icon } = ELLIPSIS_SIZE[$size];
    return css`
      width: ${box}px;
      height: ${box}px;
      > svg {
        width: ${icon}px;
        height: ${icon}px;
      }
    `;
  }}
`;

type Props = Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  /** Total number of pages */
  count: number;
  /** Current page (1-based) */
  page: number;
  onChange: (page: number) => void;
  /** Pages shown on each side of the current page. Default 1. */
  siblingCount?: number;
};

function Pagination({
  count,
  page,
  onChange,
  siblingCount = 1,
  ...rest
}: Props) {
  const items = usePagination({
    count,
    page,
    siblingCount,
  });

  const navTo = (target: number) => {
    if (target < 1 || target > count || target === page) return;
    onChange(target);
  };

  return (
    <Style {...rest} $gap={GAP_MAP[PAGINATION_SIZE]}>
      {items.map((item, index) => {
        switch (item.kind) {
          case 'previous':
            return (
              <Button
                key={`prev-${index}`}
                square
                size={PAGINATION_SIZE}
                variant="ghost"
                aria-label={t('previous_page')}
                disabled={item.disabled}
                onClick={() => navTo(page - 1)}
                icon={<ChevronLeft />}
              />
            );
          case 'next':
            return (
              <Button
                key={`next-${index}`}
                square
                size={PAGINATION_SIZE}
                variant="ghost"
                aria-label={t('next_page')}
                disabled={item.disabled}
                onClick={() => navTo(page + 1)}
                icon={<ChevronRight />}
              />
            );
          case 'start-ellipsis':
          case 'end-ellipsis':
            return (
              <Ellipsis
                key={`${item.kind}-${index}`}
                $size={PAGINATION_SIZE}
                aria-hidden="true"
              >
                <MoreHorizontal />
              </Ellipsis>
            );
          case 'page':
            return (
              <PageButton
                key={`page-${item.page}`}
                size={PAGINATION_SIZE}
                $size={PAGINATION_SIZE}
                variant={item.selected ? 'primary' : 'ghost'}
                aria-label={`Page ${item.page}`}
                aria-current={item.selected ? 'page' : undefined}
                onClick={() => navTo(item.page)}
              >
                {item.page}
              </PageButton>
            );
        }
      })}
    </Style>
  );
}

export default Pagination;
