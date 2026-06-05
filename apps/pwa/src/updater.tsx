import notice from '@/utils/notice';
import dialog from '@/utils/dialog';
import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import { MdClose } from 'react-icons/md';
import definition from './definition';
import { t } from './i18n';
import upperCaseFirstLetter from './style/upper_case_first_letter';

type VersionUpdateWorker = {
  addEventListener: (type: 'controlling', listener: () => void) => void;
  removeEventListener: (type: 'controlling', listener: () => void) => void;
  messageSkipWaiting: () => void;
};

const VersionUpdater = styled.div`
  width: min(260px, 100%);

  display: flex;
  align-items: center;
  gap: 12px;

  > .badge {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 2px solid rgb(29 139 94);
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 4px 0 rgb(29 139 94);
    color: rgb(44 182 125);
    font-size: 24px;

    > svg {
      display: block;
      width: 1em;
      height: 1em;
    }
  }

  > .body {
    flex: 1;
    min-width: 0;
    padding-top: 1px;

    > .text {
      color: #fff;
      font-size: 14px;
      font-weight: 900;
      line-height: 1.35;
      ${upperCaseFirstLetter}
    }

    > .action-box {
      margin-top: 9px;

      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 9px;

      > .confirm-action {
        color: rgb(29 139 94);
        background: #fff;
        border-color: ${CSSVariable.COLOR_CONTROL_NEUTRAL};
        box-shadow: 0 3px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};

        &:not(:disabled):hover {
          filter: brightness(1.03);
        }

        &:not(:disabled):active {
          box-shadow: none;
        }
      }
    }
  }
`;

const UPDATE_TIMEOUT = 1000 * 10;

function UpdateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M19.2 8.2A8.2 8.2 0 0 0 5.7 5.1L3.8 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.8 3.9V7h3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.8 15.8a8.2 8.2 0 0 0 13.5 3.1l1.9-1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.2 20.1V17h-3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VersionUpdateNotice({
  getNoticeId,
  wb,
}: {
  getNoticeId: () => string;
  wb: VersionUpdateWorker;
}) {
  const [updating, setUpdating] = useState(false);

  return (
    <VersionUpdater>
      <div className="badge">
        <UpdateIcon />
      </div>
      <div className="body">
        <div className="text">{t('pwa_update_question')}</div>
        <div className="action-box">
          <Button
            className="confirm-action"
            variant="primary"
            size="sm"
            loading={updating}
            onClick={() => {
              if (updating) {
                return;
              }

              setUpdating(true);

              const onControlling = () => {
                window.clearTimeout(timeoutTimer);
                wb.removeEventListener('controlling', onControlling);
                window.location.reload();
              };
              const timeoutTimer = window.setTimeout(() => {
                wb.removeEventListener('controlling', onControlling);
                notice.close(getNoticeId());
                dialog.alert({ content: t('pwa_update_try_later') });
                setUpdating(false);
              }, UPDATE_TIMEOUT);

              wb.addEventListener('controlling', onControlling);
              wb.messageSkipWaiting();
            }}
          >
            {t('pwa_update_confirm')}
          </Button>
          <Button
            className="dismiss-action"
            square
            variant="ghost"
            size="sm"
            disabled={updating}
            title={t('cancel')}
            aria-label={t('cancel')}
            onClick={() => notice.close(getNoticeId())}
          >
            <MdClose />
          </Button>
        </div>
      </div>
    </VersionUpdater>
  );
}

function openVersionUpdateNotice(wb: VersionUpdateWorker) {
  let updateNoticeId: string = '';
  updateNoticeId = notice.info(
    <VersionUpdateNotice getNoticeId={() => updateNoticeId} wb={wb} />,
    { duration: 0, closable: false, showTypeIcon: false },
  );
}

if ('serviceWorker' in navigator) {
  if (definition.WITH_SW) {
    /**
     * 生产构建: 手动注册 /service_worker.js 并接管升级提示
     * 开发模式: vite-plugin-pwa 已自动注入 dev SW 注册, 不要再手动注册避免冲突
     * @author mebtte<i@mebtte.com>
     */
    if (process.env.NODE_ENV === 'production') {
      import('workbox-window').then(({ Workbox }) => {
        const wb = new Workbox('/service_worker.js');
        wb.register();
        wb.addEventListener('waiting', () => {
          openVersionUpdateNotice(wb);
        });
      });
    }
  } else {
    window.navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        registrations.forEach((registration) => registration.unregister()),
      );
  }
}
