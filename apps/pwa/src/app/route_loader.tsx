import styled from 'styled-components';
import absoluteFullSize from '#/style/absolute_full_size';
import { flexCenter } from '#/style/flexbox';
import Spinner from '#/components/spinner';
import ErrorCard from '../components/error_card';

const Container = styled.div`
  ${absoluteFullSize}
  ${flexCenter}
`;

function RouteLoader({ error }: { error?: Error }) {
  return error ? (
    <Container>
      <ErrorCard
        errorMessage={error.message}
        retry={() => window.location.reload()}
      />
    </Container>
  ) : (
    <Container>
      <Spinner />
    </Container>
  );
}

export default RouteLoader;
