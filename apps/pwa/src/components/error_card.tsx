import { HTMLAttributes, memo } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { t } from '@/i18n';

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M12 7.25v6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.25" fill="currentColor" />
    </svg>
  );
}

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

  > .error-icon {
    width: 44px;
    height: 44px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: ${CSSVariable.COLOR_DANGEROUS};
    font-size: 42px;
    line-height: 1;

    > svg {
      display: block;
    }
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

    > .error-icon {
      width: 40px;
      height: 40px;
      font-size: 38px;
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
      <div className="error-icon">
        <ErrorIcon />
      </div>
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
