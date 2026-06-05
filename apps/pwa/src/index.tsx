import './polyfill'; // make sure that polyfill is at first
import './updater';
import './devtool';
import './disable_zoom';
import './global_states/server_account_cleanup';
import { createRoot } from 'react-dom/client';
import 'cropperjs/dist/cropper.min.css';
import App from './app';

createRoot(document.querySelector('#root')!).render(<App />);
