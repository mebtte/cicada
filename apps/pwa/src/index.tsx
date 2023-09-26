import './polyfill'; // 需要保证 polyfill 在第一个
import './updater';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import App from './app';
import Unsupported from './unsupported';

function findUnsupportedList(): string[] {
  const unsupportedList: string[] = [];

  if (!window.CSS.supports('height', '1dvh')) {
    unsupportedList.push('https://caniuse.com/viewport-unit-variants');
  }

  return unsupportedList;
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
