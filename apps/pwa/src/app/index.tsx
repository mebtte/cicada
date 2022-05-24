import { ThemeProvider } from '@mui/material';
import ErrorBoundary from '@/components/error_boundary';
import theme from '@/style/theme';
import App from './app';
import UncaughtError from './uncaught_error';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  return (
    <ErrorBoundary fallback={fallback}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Wrapper;
