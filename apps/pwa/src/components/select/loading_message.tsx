import { CSSProperties } from 'react';
import Spinner from '../spinner';

const style: CSSProperties = {
  margin: '10px',
};

function LoadingIndicator() {
  return <Spinner size={18} style={style} />;
}

export default LoadingIndicator;
