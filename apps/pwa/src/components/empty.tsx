import { HTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { t } from '@/i18n';

function EmptyIcon() {
  return (
    <svg
      className="placeholder"
      viewBox="0 0 128 128"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="64"
        cy="64"
        r="44"
        fill="rgb(44 182 125 / 0.1)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        cx="64"
        cy="64"
        r="28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="3 6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="64" cy="64" r="11" fill="currentColor" />
      <circle cx="64" cy="64" r="3" fill="white" />
    </svg>
  );
}

const Style = styled.div`
  width: min(100%, 360px);
  margin: 0 auto;
  padding: 16px 12px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;

  animation: empty-pop-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1) both;

  @keyframes empty-pop-in {
    0% {
      transform: scale(0.86);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  > .placeholder {
    width: 132px;
    max-width: 56%;
    display: block;
    color: ${CSSVariable.COLOR_PRIMARY};
    filter: drop-shadow(0 4px 0 rgb(44 182 125 / 0.15));
  }

  > .text {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  > .text > .description {
    width: 100%;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.45;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    overflow-wrap: anywhere;

    ${capitalize}
  }

  > .text > .secondary {
    width: 100%;
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 600;
    line-height: 1.5;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    overflow-wrap: anywhere;
  }

  @media (max-width: 420px) {
    padding: 12px 10px;
    gap: 12px;

    > .placeholder {
      width: 120px;
    }
  }
`;

/**
 * 空数据
 * @author mebtte<i@mebtte.com>
 */
function Empty({
  description = t('no_data'),
  secondaryDescription,
  ...props
}: {
  description?: string;
  secondaryDescription?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props}>
      <EmptyIcon />
      <div className="text">
        <div className="description">{description}</div>
        {secondaryDescription ? (
          <div className="secondary">{secondaryDescription}</div>
        ) : null}
      </div>
    </Style>
  );
}

export default memo(Empty);
