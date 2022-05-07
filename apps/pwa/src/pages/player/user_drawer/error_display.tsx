import styled from 'styled-components';
import { animated } from 'react-spring';

import ErrorCard from '@/components/error_card';
import { containerStyle } from './constants';

const Style = styled(animated.div)`
  ${containerStyle}

  display: flex;
  align-items: center;
  justify-content: center;
`;

function ErrorDisplay({
  error,
  reload,
  style,
}: {
  error: Error;
  reload: () => void;
  style: unknown;
}) {
  return (
    // @ts-expect-error
    <Style style={style}>
      <ErrorCard errorMessage={error.message} retry={reload} />
    </Style>
  );
}

export default ErrorDisplay;
