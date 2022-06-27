import { ThemeProvider } from '@mui/material';
import ErrorBoundary from '@/components/error_boundary';
import theme from '@/style/theme';
import { GlobalStyle } from '#/global_style';
import App from './app';
import UncaughtError from './uncaught_error';
import useProfileUpdate from './use_profile_update';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  useProfileUpdate();

  return (
    <ErrorBoundary fallback={fallback}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Wrapper;
