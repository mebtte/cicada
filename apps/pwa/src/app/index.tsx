import ErrorBoundary from '@/components/error_boundary';
import { GlobalStyle } from '@/global_style';
import { ThemeProvider } from 'styled-components';
import { ThemeProvider as CicadaThemeProvider } from '@/components/theme';
import { HashRouter } from 'react-router-dom';
import App from './app';
import UncaughtError from './uncaught_error';
import Head from './head';
import { useTheme } from '@/global_states/theme';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  return (
    <ErrorBoundary fallback={fallback}>
      <HashRouter>
        <CicadaThemeProvider>
          <ThemeProvider theme={useTheme()}>
            <Head />
            <App />
            <GlobalStyle />
          </ThemeProvider>
        </CicadaThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default Wrapper;
