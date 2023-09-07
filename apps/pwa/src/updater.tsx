import notice from '@/utils/notice';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdCheck, MdClose } from 'react-icons/md';
import sleep from '#/utils/sleep';
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
if ('serviceWorker' in navigator) {
  if (definition.WITH_SW) {
    window.requestIdleCallback(() =>
      import('workbox-window').then(({ Workbox }) => {
        const wb = new Workbox('/service_worker.js');
        wb.register();

        /**
         * 生产模式下询问是否升级
         * 开发模式下默认升级
         * @author mebtte<hi@mebtte.com>
         */
        if (process.env.NODE_ENV === 'production') {
          let updateNoticeId: string = '';
          wb.addEventListener('waiting', () => {
            updateNoticeId = notice.info(
              <VersionUpdater>
                <div className="text">{t('pwa_update_question')}</div>
                <div className="action-box">
                  <IconButton
                    className="action"
                    onClick={() => {
                      wb.messageSkipWaiting();
                      return Promise.race([
                        new Promise((resolve) =>
                          wb.addEventListener('controlling', resolve),
                        ),
                        sleep(5000),
                      ]).then(() => window.location.reload());
                    }}
                  >
                    <MdCheck />
                  </IconButton>
                  <IconButton
                    className="action"
                    onClick={() => notice.close(updateNoticeId)}
                  >
                    <MdClose />
                  </IconButton>
                </div>
              </VersionUpdater>,
              { duration: 0, closable: false },
            );
          });

          /**
           * 定时检查更新
           * @author mebtte<hi@mebtte.com>
           */
          window.setInterval(() => {
            notice.close(updateNoticeId);
            return wb.update();
          }, 1000 * 60 * 60);
        }
      }),
    );
  } else {
    window.requestIdleCallback(() => {
      window.navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
    });
  }
}
