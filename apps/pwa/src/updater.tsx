import notice from '@/utils/notice';
import { useState } from 'react';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdCheck, MdClose } from 'react-icons/md';
import definition from './definition';
import { t } from './i18n';
import upperCaseFirstLetter from './style/upper_case_first_letter';

const VersionUpdater = styled.div`
  > .text {
    padding-top: 10px;
    ${upperCaseFirstLetter}
  }

  > .action-box {
    margin-top: 5px;

    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;

    > .action {
      color: #fff;
    }
  }
`;

const UPDATE_TIMEOUT = 1000 * 10;

function VersionUpdateNotice({
  getNoticeId,
  wb,
}: {
  getNoticeId: () => string;
  wb: {
    addEventListener: (type: 'controlling', listener: () => void) => void;
    removeEventListener: (type: 'controlling', listener: () => void) => void;
    messageSkipWaiting: () => void;
  };
}) {
  const [updating, setUpdating] = useState(false);

  return (
    <VersionUpdater>
      <div className="text">{t('pwa_update_question')}</div>
      <div className="action-box">
        <IconButton
          className="action"
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
              notice.error(t('pwa_update_try_later'));
              setUpdating(false);
            }, UPDATE_TIMEOUT);

            wb.addEventListener('controlling', onControlling);
            wb.messageSkipWaiting();
          }}
        >
          <MdCheck />
        </IconButton>
        <IconButton
          className="action"
          disabled={updating}
          onClick={() => notice.close(getNoticeId())}
        >
          <MdClose />
        </IconButton>
      </div>
    </VersionUpdater>
  );
}

if ('serviceWorker' in navigator) {
  if (definition.WITH_SW) {
    import('workbox-window').then(({ Workbox }) => {
      const wb = new Workbox('/service_worker.js');
      wb.register();

      /**
       * 生产模式下询问是否升级
       * 开发模式下默认升级
       * @author mebtte<i@mebtte.com>
       */
      if (process.env.NODE_ENV === 'production') {
        let updateNoticeId: string = '';
        wb.addEventListener('waiting', () => {
          updateNoticeId = notice.info(
            <VersionUpdateNotice getNoticeId={() => updateNoticeId} wb={wb} />,
            { duration: 0, closable: false },
          );
        });
      }
    });
  } else {
    window.navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        registrations.forEach((registration) => registration.unregister()),
      );
  }
}
