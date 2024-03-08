import 'styled-components';

export interface Theme {
  miniMode: boolean;
  autoScrollbar: boolean;
}

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
