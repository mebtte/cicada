import React from 'react';

import ErrorCard from '../components/error_card';

const style = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: '0',
  left: '0',
};

const UncaughtError = ({ error }: { error: Error }) => (
  <ErrorCard
    errorMessage={`未知错误: ${error.message}`}
    retry={() => window.location.reload()}
    style={style}
  />
);

export default UncaughtError;
