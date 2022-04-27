import React from 'react';

import ErrorCard from '../components/error_card';
import LoadingCard from '../components/loading_card';

const style = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
};

const RouteLoader = ({ error }: { error?: Error }) =>
  error ? (
    <ErrorCard
      errorMessage={error.message}
      retry={() => window.location.reload()}
      style={style}
    />
  ) : (
    <LoadingCard style={style} />
  );

export default RouteLoader;
