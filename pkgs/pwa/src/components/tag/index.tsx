import React from 'react';
import styled, { css } from 'styled-components';

export enum Type {
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
  MV = 'mv',
  FORK = 'fork',
  FORK_FROM = 'fork_from',
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
  [Type.MV]: {
    label: 'mv',
    color: 'rgb(65, 187, 235)',
  },
  [Type.FORK]: {
    label: 'fo',
    color: 'rgb(226, 65, 235)',
  },
  [Type.FORK_FROM]: {
    label: 'ff',
    color: 'rgb(102 65 235)',
  },
};

const Style = styled.div`
  display: inline-block;
  font-size: 12px;
  line-height: 12px;
  border-width: 1px;
  border-radius: 2px;
  border-style: solid;
  padding: 1px 3px;
  ${({ color }) => css`
    color: ${color};
    border-color: ${color};
  `}
`;

interface Props {
  type: Type;
  gray?: boolean;
  [key: string]: any;
}

const Tag = React.forwardRef<HTMLDivElement, Props>(
  ({ type, gray = false, ...props }: Props, ref) => {
    const { label, color } = TYPE_MAP[type];
    return (
      <Style {...props} ref={ref} color={gray ? 'rgb(188 188 188)' : color}>
        {label}
      </Style>
    );
  },
);

export default React.memo(Tag);
