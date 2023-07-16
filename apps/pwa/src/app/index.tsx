import ErrorBoundary from '@/components/error_boundary';
import { GlobalStyle } from '@/global_style';
import { ThemeProvider } from 'styled-components';
import App from './app';
import UncaughtError from './uncaught_error';
import useProfileUpdate from './use_profile_update';
import mm from '../global_states/mini_mode';
import Head from './head';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  const miniMode = mm.useState();

  useProfileUpdate();

  return (
    <ErrorBoundary fallback={fallback}>
      <ThemeProvider theme={{ miniMode }}>
        <Head />
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Wrapper;
