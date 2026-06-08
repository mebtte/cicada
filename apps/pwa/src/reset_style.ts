import { createGlobalStyle } from 'styled-components';

export const ResetStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  button,
  input,
  textarea,
  select {
    font-family: inherit;
  }

  img,
  svg {
    -webkit-user-drag: none;
  }

  #root {
    height: 100%;
  }
`;
