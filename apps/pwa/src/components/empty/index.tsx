import { HTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { t } from '@/i18n';
import emptyPlaceholder from './empty_placeholder.png';

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
    width: 172px;
    max-width: 56%;
    display: block;
    height: auto;
    user-select: none;
    filter: drop-shadow(0 10px 18px rgb(44 182 125 / 0.14));
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
  ...props
}: {
  description?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props}>
      <img
        className="placeholder"
        src={emptyPlaceholder}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="text">
        <div className="description">{description}</div>
      </div>
    </Style>
  );
}

export default memo(Empty);
