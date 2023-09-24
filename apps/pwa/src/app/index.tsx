import ErrorBoundary from '@/components/error_boundary';
import { GlobalStyle } from '@/global_style';
import { ThemeProvider } from 'styled-components';
import App from './app';
import UncaughtError from './uncaught_error';
import theme from '../global_states/theme';
import Head from './head';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  return (
    <ErrorBoundary fallback={fallback}>
      <ThemeProvider theme={theme.useState()}>
        <Head />
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default Wrapper;
