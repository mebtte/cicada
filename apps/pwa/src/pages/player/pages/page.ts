import absoluteFullSize from '@/style/absolute_full_size';
import styled, { css } from 'styled-components';

export const PAGE_HORIZONTAL_PADDING_DESKTOP = '20px';
export const PAGE_HORIZONTAL_PADDING_MOBILE = '12px';
export const PAGE_HORIZONTAL_PADDING_BREAKPOINT = 680;
export const PAGE_HORIZONTAL_PADDING = `var(--player-page-horizontal-padding, ${PAGE_HORIZONTAL_PADDING_DESKTOP})`;

// 播放器页面的横向留白以乐单详情页为基准。
export const pageHorizontalPaddingVars = css`
  --player-page-horizontal-padding: ${PAGE_HORIZONTAL_PADDING_DESKTOP};

  @media (max-width: ${PAGE_HORIZONTAL_PADDING_BREAKPOINT}px) {
    --player-page-horizontal-padding: ${PAGE_HORIZONTAL_PADDING_MOBILE};
  }
`;

export const pageHorizontalPadding = css`
  padding-left: ${PAGE_HORIZONTAL_PADDING};
  padding-right: ${PAGE_HORIZONTAL_PADDING};
`;

export default styled.div`
  ${absoluteFullSize}
  ${pageHorizontalPaddingVars}
`;
