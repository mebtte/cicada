import './polyfill';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import notice from '#/utils/notice';
import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdCheck, MdClose } from 'react-icons/md';
import sleep from '#/utils/sleep';
import App from './app';
import env from './env';

createRoot(document.querySelector('#root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);

const VersionUpdater = styled.div`
  > .text {
    padding-top: 10px;
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
  if (env.WITH_SW) {
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
                <div className="text">检测到新版本, 是否马上加载?</div>
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
                    onClick={() => notice.close(id)}
                  >
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
