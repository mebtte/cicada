import { HTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { t } from '@/i18n';

function EmptyIcon() {
  return (
    <svg
      className="placeholder"
      viewBox="0 0 128 112"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M31 35.5h66l12 22.5v31.5c0 8-6.5 14.5-14.5 14.5h-61C25.5 104 19 97.5 19 89.5V58l12-22.5Z"
        fill="rgb(232 255 218)"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M19 58h30.5c3 0 5.7 1.7 7 4.4l1.6 3.2c2.3 4.6 8.9 4.6 11.2 0l1.6-3.2c1.3-2.7 4-4.4 7-4.4H109"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42.5 78.5h43"
        stroke="rgb(88 204 2)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M47 15.5 64 5l17 10.5"
        stroke="rgb(255 199 44)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43.5" cy="20.5" r="5.5" fill="rgb(255 199 44)" />
      <circle cx="84.5" cy="20.5" r="5.5" fill="rgb(255 199 44)" />
    </svg>
  );
}

const Style = styled.div`
  width: min(100%, 360px);
  margin: 0 auto;
  padding: 12px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;

  > .placeholder {
    width: 164px;
    max-width: 66%;
    display: block;
    color: ${CSSVariable.COLOR_PRIMARY};
    filter: drop-shadow(0 4px 0 rgb(232 232 232));
  }

  > .description {
    width: 100%;
    max-width: 280px;

    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    line-height: 1.5;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    overflow-wrap: anywhere;

    ${capitalize}
  }

  @media (max-width: 420px) {
    padding: 10px;
    gap: 10px;

    > .placeholder {
      width: 150px;
    }
  }
`;

/**
 * 空数据
 * @author mebtte<i@mebtte.com>
 */
function Empty({
  /** 描述 */
  description = t('no_data'),
  ...props
}: {
  description?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props}>
      <EmptyIcon />
      <div className="description">{description}</div>
    </Style>
  );
}

export default memo(Empty);
