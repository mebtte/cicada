import ErrorBoundary from '@/components/error_boundary';
import { GlobalStyle } from '#/global_style';
import App from './app';
import UncaughtError from './uncaught_error';
import useProfileUpdate from './use_profile_update';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  useProfileUpdate();

  return (
    <ErrorBoundary fallback={fallback}>
      <GlobalStyle />
      <App />
    </ErrorBoundary>
  );
}

export default Wrapper;
