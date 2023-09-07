import './polyfill'; // 需要保证 polyfill 在第一个
import './updater';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import App from './app';
import Unsupported from './unsupported';
import { enable as debugEnable } from './global_states/debug_setting';
import logger from './utils/logger';

function findUnsupportedList(): string[] {
  return [];
}

const unsupportedList = findUnsupportedList();
const root = createRoot(document.querySelector('#root')!);
if (unsupportedList.length) {
  root.render(<Unsupported unsupportedList={unsupportedList} />);
} else {
  root.render(
    <HashRouter>
      <App />
    </HashRouter>,
  );
}

if (debugEnable) {
  import('./debug').catch((error) =>
    logger.error(error, 'Failed to load debug module'),
  );
}
