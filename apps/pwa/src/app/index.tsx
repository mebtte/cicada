import ErrorBoundary from '@/components/error_boundary';
import App from './app';
import UncaughtError from './uncaught_error';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  return (
    <ErrorBoundary fallback={fallback}>
      <App />
    </ErrorBoundary>
  );
}

export default Wrapper;
