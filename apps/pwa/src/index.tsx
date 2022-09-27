import './polyfill';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import notice from '#/utils/notice';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdCheck, MdClose } from 'react-icons/md';
import App from './app';

createRoot(document.querySelector('#root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);

const VersionUpdater = styled.div`
  > .action {
    margin-top: 5px;

    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
  }
`;
if ('serviceWorker' in navigator) {
  // @ts-expect-error
  // eslint-disable-next-line no-undef
  if (__WITH_SW__) {
    window.requestIdleCallback(() =>
      import('workbox-window').then(({ Workbox }) => {
        const wb = new Workbox('/service_worker.js');

        /**
         * 生产模式下询问是否升级
         * 开发模式下默认升级
         * @author mebtte<hi@mebtte.com>
         */
        if (process.env.NODE_ENV === 'production') {
          wb.addEventListener('waiting', () => {
            const id = notice.info(
              <VersionUpdater>
                <div>检测到新版本, 是否刷新马上使用?</div>
                <div className="action">
                  <IconButton
                    onClick={() => {
                      wb.addEventListener('controlling', () =>
                        window.location.reload(),
                      );
                      wb.messageSkipWaiting();
                    }}
                  >
                    <MdCheck />
                  </IconButton>
                  <IconButton onClick={() => notice.close(id)}>
                    <MdClose />
                  </IconButton>
                </div>
              </VersionUpdater>,
              { duration: 0, closable: false },
            );
          });
        }

        wb.register();
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
