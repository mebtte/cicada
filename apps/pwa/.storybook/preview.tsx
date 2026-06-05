import type { Preview } from '@storybook/react';
import { createGlobalStyle } from 'styled-components';
import { GlobalStyle } from '../src/global_style';
import { ThemeProvider } from '../src/components/theme';

const FontStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap');
`;

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const primaryColor = context.globals?.primaryColor as string | undefined;
      return (
        <ThemeProvider theme={primaryColor ? { colorPrimary: primaryColor } : undefined}>
          <FontStyle />
          <GlobalStyle />
          <Story />
        </ThemeProvider>
      );
    },
  ],
  globalTypes: {
    primaryColor: {
      description: '主题色',
      toolbar: {
        title: '主题色',
        icon: 'paintbrush',
        items: [
          { value: 'rgb(44 182 125)', title: '默认绿' },
          { value: 'rgb(99 102 241)', title: '紫色' },
          { value: 'rgb(239 68 68)',  title: '红色' },
          { value: 'rgb(245 158 11)', title: '橙色' },
          { value: 'rgb(14 165 233)', title: '蓝色' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light',   value: '#ffffff' },
        { name: 'surface', value: '#f8f9fb' },
        { name: 'dark',    value: '#1a1a1a' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date:  /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (390)',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        mobileSmall: {
          name: 'Mobile (375)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
      },
    },
  },
};

export default preview;
