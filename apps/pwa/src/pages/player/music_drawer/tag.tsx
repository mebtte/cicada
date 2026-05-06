import { CSSVariable } from '@/global_style';
import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

const Style = styled.div<{ $compact: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? '4px' : '10px')};
  min-width: 0;
  height: ${({ $compact }) => ($compact ? '26px' : 'auto')};
  min-height: ${({ $compact }) => ($compact ? '0' : '54px')};
  padding: ${({ $compact }) => ($compact ? '0 8px' : '9px 12px 12px')};

  background: ${({ $compact }) =>
    $compact ? 'rgb(255 255 255 / 0.9)' : '#fff'};
  border: ${({ $compact }) =>
    $compact ? '1px solid rgb(255 255 255 / 0.78)' : '2px solid rgb(229 229 229)'};
  border-radius: ${({ $compact }) => ($compact ? '999px' : '14px')};
  box-shadow: ${({ $compact }) =>
    $compact ? '0 2px 0 rgb(0 0 0 / 0.18)' : '0 4px 0 rgb(229 229 229)'};
  backdrop-filter: ${({ $compact }) => ($compact ? 'blur(6px)' : 'none')};

  > .icon {
    flex: 0 0 auto;

    width: ${({ $compact }) => ($compact ? '15px' : '26px')};
    height: ${({ $compact }) => ($compact ? '15px' : '26px')};

    display: flex;
    align-items: center;
    justify-content: center;

    color: ${CSSVariable.COLOR_PRIMARY};
    font-size: ${({ $compact }) => ($compact ? '13px' : '20px')};
    line-height: 1;

    > svg {
      display: block;
    }
  }

  > .body {
    flex: 1;
    min-width: 0;
  }

  > .body > .label,
  > .body > .text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > .body > .label {
    margin-bottom: 2px;

    color: rgb(155 155 155);
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    line-height: 1.15;
  }

  > .body > .text {
    color: rgb(75 75 75);
    font-family: monospace;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.2;
  }

  ${({ $compact }) =>
    $compact &&
    css`
      > .body {
        flex: 0 1 auto;
        height: 100%;

        display: flex;
        align-items: center;
      }

      > .body > .label {
        display: none;
      }

      > .body > .text {
        height: 100%;

        display: flex;
        align-items: center;

        color: rgb(75 75 75);
        font-size: 11px;
        line-height: 1;
      }
    `}
`;

function Tag({
  title,
  icon,
  text,
  compact = false,
}: {
  title: string;
  icon: ReactNode;
  text: string | number;
  compact?: boolean;
}) {
  return (
    <Style title={title} $compact={compact}>
      <div className="icon">{icon}</div>
      <div className="body">
        <div className="label">{title}</div>
        <div className="text">{text}</div>
      </div>
    </Style>
  );
}

export default Tag;
