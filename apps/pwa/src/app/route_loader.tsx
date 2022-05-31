import { CSSProperties } from 'react';
import ErrorCard from '../components/error_card';
import LoadingCard from '../components/loading_card';

const style: CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
};

function RouteLoader({ error }: { error?: Error }) {
  return error ? (
    <ErrorCard
      errorMessage={error.message}
      retry={() => window.location.reload()}
      style={style}
    />
  ) : (
    <LoadingCard style={style} />
  );
}

export default RouteLoader;
