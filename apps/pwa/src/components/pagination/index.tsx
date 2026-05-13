import { HtmlHTMLAttributes, Ref } from 'react';
import styled, { css } from 'styled-components';
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdFirstPage,
  MdLastPage,
  MdMoreHoriz,
} from 'react-icons/md';
import Button, { Size } from '@/components/button';
import usePagination from './use_pagination';
import { t } from '@/i18n';

const GAP_MAP: Record<Size, number> = { sm: 5, md: 6, lg: 8 };
const SHADOW_OFFSET: Record<Size, number> = { sm: 3, md: 4, lg: 5 };
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
const PageButton = styled(Button)<{ $selected: boolean; $size: Size }>`
  min-width: ${({ $size }) => ELLIPSIS_SIZE[$size].box}px;

  ${({ $selected, $size }) =>
    !$selected &&
    css`
      transition:
        background 150ms ease-out,
        border-color 150ms ease-out,
        box-shadow 150ms ease-out,
        transform 150ms ease-out,
        filter 120ms ease-out;

      &:not(:disabled):hover {
        background: #fff;
        border-color: rgb(180 180 180);
        box-shadow: 0 ${SHADOW_OFFSET[$size]}px 0 rgb(180 180 180);
      }

      &:not(:disabled):active {
        transition:
          transform 60ms ease-in,
          box-shadow 60ms ease-in,
          filter 60ms ease-in;
      }
    `}
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
  /** Pages shown at the start and end of the range. Default 1. */
  boundaryCount?: number;
  /** Show a "first page" jump button. Default false. */
  showFirstButton?: boolean;
  /** Show a "last page" jump button. Default false. */
  showLastButton?: boolean;
  disabled?: boolean;
  size?: Size;
  ref?: Ref<HTMLDivElement>;
};

function Pagination({
  count,
  page,
  onChange,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstButton = false,
  showLastButton = false,
  disabled = false,
  size = 'sm',
  ref,
  ...rest
}: Props) {
  const items = usePagination({
    count,
    page,
    siblingCount,
    boundaryCount,
    showFirstButton,
    showLastButton,
  });

  const navTo = (target: number) => {
    if (disabled) return;
    if (target < 1 || target > count || target === page) return;
    onChange(target);
  };

  return (
    <Style {...rest} ref={ref} $gap={GAP_MAP[size]}>
      {items.map((item, index) => {
        switch (item.kind) {
          case 'first':
            return (
              <Button
                key={`first-${index}`}
                square
                size={size}
                variant="ghost"
                aria-label={t('first_page')}
                disabled={disabled || item.disabled}
                onClick={() => navTo(1)}
                icon={<MdFirstPage />}
              />
            );
          case 'last':
            return (
              <Button
                key={`last-${index}`}
                square
                size={size}
                variant="ghost"
                aria-label={t('last_page')}
                disabled={disabled || item.disabled}
                onClick={() => navTo(count)}
                icon={<MdLastPage />}
              />
            );
          case 'previous':
            return (
              <Button
                key={`prev-${index}`}
                square
                size={size}
                variant="ghost"
                aria-label={t('previous_page')}
                disabled={disabled || item.disabled}
                onClick={() => navTo(page - 1)}
                icon={<MdKeyboardArrowLeft />}
              />
            );
          case 'next':
            return (
              <Button
                key={`next-${index}`}
                square
                size={size}
                variant="ghost"
                aria-label={t('next_page')}
                disabled={disabled || item.disabled}
                onClick={() => navTo(page + 1)}
                icon={<MdKeyboardArrowRight />}
              />
            );
          case 'start-ellipsis':
          case 'end-ellipsis':
            return (
              <Ellipsis
                key={`${item.kind}-${index}`}
                $size={size}
                aria-hidden="true"
              >
                <MdMoreHoriz />
              </Ellipsis>
            );
          case 'page':
            return (
              <PageButton
                key={`page-${item.page}`}
                size={size}
                $selected={item.selected}
                $size={size}
                variant={item.selected ? 'primary' : 'plain'}
                aria-label={`Page ${item.page}`}
                aria-current={item.selected ? 'page' : undefined}
                disabled={disabled}
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
