import { memo } from 'react';
import ReactDOM from 'react-dom';

import ToastList from './toast_list';

const ToastWrapper = () => ReactDOM.createPortal(<ToastList />, document.body);

export default memo(ToastWrapper);
