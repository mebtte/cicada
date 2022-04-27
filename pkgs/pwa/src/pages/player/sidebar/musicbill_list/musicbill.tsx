import React from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import ellipsis from '@/style/ellipsis';
import { CONTAINETR_STYLE, NAME_STYLE } from './constants';
import { Musicbill as MusicbillType } from '../../constants';
import Cover from './cover';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Style = styled(({ active, ...props }: any) => <Link {...props} />)<{
  active: boolean;
}>`
  display: block;
  text-decoration: none;
  position: relative;
  > .content {
    ${CONTAINETR_STYLE}
    position: relative;
    background: linear-gradient(
      to right,
      rgb(255 255 255 / 0.3),
      rgb(255 255 255 / 1)
    );
    > .name {
      ${ellipsis}
      ${NAME_STYLE}
      user-select: none;
      color: var(--text-color-primary);
    }
  }
  > .background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
  }

  &:hover {
    > .content {
      > .name {
        color: var(--color-primary);
      }
    }
  }

  ${({ active }) => css`
    > .content {
      > .name {
        opacity: ${active ? 0 : 1};
      }
    }
  `}
`;

const Musicbill = ({
  musicbill,
  to,
  active,
}: {
  musicbill: MusicbillType;
  to: string;
  active: boolean;
}) => {
  const { name, cover, public: publiz } = musicbill;
  return (
    <Style to={to} active={active}>
      {active && (
        <div
          className="background"
          style={{ backgroundImage: `url(${cover})` }}
        />
      )}
      <div className="content">
        <Cover src={cover} publiz={publiz} />
        <div className="name">{name}</div>
      </div>
    </Style>
  );
};

export default Musicbill;
