import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import PageContainer from '@/components/page_container';
import ErrorCard from '../components/error_card';

const Container = styled(PageContainer)`
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
