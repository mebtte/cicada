import { CSSProperties } from 'react';
import ErrorCard from '../components/error_card';

const style: CSSProperties = {
  position: 'absolute',
  inset: 0,
};

function UncaughtError({ error }: { error: Error }) {
  return (
    <ErrorCard
      errorMessage={`未知错误: ${error.message}`}
      retry={() => window.location.reload()}
      style={style}
    />
  );
}

export default UncaughtError;
