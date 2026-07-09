import { HtmlHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { CSS_VAR } from '@/components/theme';
import { CONTROLLER_COVER_SHADOW } from '../constants';
import { Expand } from '@/components/icon';
import BaseCover, { Shape } from '@/components/cover';

const Style = styled.div<{ $pressable: boolean }>`
  position: relative;

  height: 100%;

  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid var(${CSS_VAR.colorPrimaryShadow});
  border-radius: 12px;
  box-shadow: 0 ${CONTROLLER_COVER_SHADOW}px 0 var(${CSS_VAR.colorPrimaryShadow});
  background: #fff;
  transition:
    transform 80ms ease,
    box-shadow 80ms ease;

  > .expand {
    ${absoluteFullSize}
    ${flexCenter}

    cursor: pointer;
    opacity: 0;
    transition: 100ms;
    background-color: rgb(0 0 0 / 0.5);
    color: #fff;

    > svg {
      width: 33%;
      height: 33%;
    }
  }

  &:hover {
    > .expand {
      opacity: 1;
    }
  }

  ${({ $pressable }) =>
    $pressable
      ? css`
          cursor: pointer;

          /* 按下时整体下移阴影的距离, 同时抵消阴影, 形成贴合底部的按压反馈 */
          &:active {
            transform: translateY(${CONTROLLER_COVER_SHADOW}px);
            box-shadow: 0 0 0 var(${CSS_VAR.colorPrimaryShadow});
          }
        `
      : null}
`;
const CoverImage = styled(BaseCover)`
  ${absoluteFullSize}
`;

function Wrapper({
  cover,
  placeholderCover,
  mask,
  ...props
}: {
  cover?: string;
  placeholderCover?: string;
  mask: boolean;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props} $pressable={mask}>
      <CoverImage
        src={cover || ''}
        placeholderSrc={placeholderCover}
        size="100%"
        shape={Shape.SQUARE}
      />
      {mask ? (
        <div className="expand">
          <Expand aria-hidden="true" />
        </div>
      ) : null}
    </Style>
  );
}

export default Wrapper;
