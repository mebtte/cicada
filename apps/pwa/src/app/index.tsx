import ErrorBoundary from '@/components/error_boundary';
import { GlobalStyle } from '@/global_style';
import { GlobalStyle as SelectGlobalStyle } from '@/components/select';
import { ThemeProvider } from 'styled-components';
import { HashRouter } from 'react-router-dom';
import App from './app';
import UncaughtError from './uncaught_error';
import theme from '../global_states/theme';
import Head from './head';

const fallback = (error: Error) => <UncaughtError error={error} />;

function Wrapper() {
  return (
    <ErrorBoundary fallback={fallback}>
      <HashRouter>
        <ThemeProvider theme={theme.useState()}>
          <Head />
          <App />
          <GlobalStyle />
          <SelectGlobalStyle />
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default Wrapper;
