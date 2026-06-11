import { HTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { t } from '@/i18n';
import ErrorImage from './error.png';

function RefreshIcon() {
  return (
    <svg
      className="refresh-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20 6.75v5h-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.15 11.75a7 7 0 1 0-2.05 4.95"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
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
  gap: 10px;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;

  > .error-placeholder {
    width: min(100%, 260px);
    height: auto;
    display: block;
    pointer-events: none;
    user-select: none;
  }

  > .error-message {
    width: 100%;
    max-width: 280px;

    white-space: pre-wrap;
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    line-height: 1.5;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    overflow-wrap: anywhere;

    ${upperCaseFirstLetter}
  }

  > .retry {
    margin-top: 2px;

    > .refresh-icon {
      flex: 0 0 auto;
      display: block;
    }
  }

  @media (max-width: 420px) {
    padding: 10px;

    > .error-placeholder {
      width: min(100%, 220px);
    }
  }
`;

/**
 * 错误卡片
 * @author mebtte<i@mebtte.com>
 */
function ErrorCard({
  errorMessage,
  retry,
  ...props
}: {
  /** 错误信息 */
  errorMessage: string;
  /** 重试方法 */
  retry: () => void;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Style {...props}>
      <img
        className="error-placeholder"
        src={ErrorImage}
        alt=""
        aria-hidden="true"
      />
      <div className="error-message">{errorMessage}</div>
      <Button
        className="retry"
        variant="primary"
        size="sm"
        icon={<RefreshIcon />}
        onClick={retry}
      >
        {t('retry')}
      </Button>
    </Style>
  );
}

export default memo(ErrorCard);
