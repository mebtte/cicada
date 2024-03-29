import './polyfill'; // make sure that polyfill is first
import './updater';
import './devtool';
import { createRoot } from 'react-dom/client';
import 'cropperjs/dist/cropper.min.css';
import App from './app';
import Unsupported from './unsupported';

function findUnsupportedList(): string[] {
  const unsupportedList: string[] = [];

  if (!window.CSS.supports('height', '1dvb')) {
    unsupportedList.push('https://caniuse.com/viewport-unit-variants');
  }

  return unsupportedList;
}

const unsupportedList = findUnsupportedList();
const root = createRoot(document.querySelector('#root')!);
if (unsupportedList.length) {
  root.render(<Unsupported unsupportedList={unsupportedList} />);
} else {
  root.render(<App />);
}
