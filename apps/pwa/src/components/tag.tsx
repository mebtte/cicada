import { ForwardedRef, forwardRef, HtmlHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

export enum Type {
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
}

const TYPE_MAP: Record<
  Type,
  {
    label: string;
    color: string;
  }
> = {
  [Type.SQ]: {
    label: 'sq',
    color: 'var(--color-primary)',
  },
  [Type.HQ]: {
    label: 'hq',
    color: 'rgb(235, 65, 65)',
  },
  [Type.AC]: {
    label: 'ac',
    color: 'rgb(235, 150, 65)',
  },
};

const Style = styled.div`
  padding: 1px 3px;

  display: inline-block;

  font-size: 12px;
  line-height: 12px;
  border-width: 1px;
  border-style: solid;
  user-select: none;

  ${({ color }) => css`
    color: ${color};
    border-color: ${color};
  `}
`;

type Props = HtmlHTMLAttributes<HTMLDivElement> & {
  type: Type;
  gray?: boolean;
};

function Tag(
  { type, gray = false, ...props }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { label, color } = TYPE_MAP[type];
  return (
    <Style {...props} ref={ref} color={gray ? 'rgb(188 188 188)' : color}>
      {label}
    </Style>
  );
}

export default forwardRef<HTMLDivElement, Props>(Tag);
