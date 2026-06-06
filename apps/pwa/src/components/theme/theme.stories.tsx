import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme } from '.';
import Button from '../button';
import Spinner from '../spinner';

function ThemedDemo() {
  const theme = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Spinner size={36} />
      <Button>{`Primary: ${theme.colorPrimary}`}</Button>
    </div>
  );
}

function DefaultDemo() {
  return (
    <ThemeProvider>
      <ThemedDemo />
    </ThemeProvider>
  );
}

const meta = {
  title: 'Utility/Theme',
  component: DefaultDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Theme context for color-primary-aware components. `ThemeProvider` exposes CSS variables on a `display:contents` wrapper so descendants pick up the default primary color without changing the layout.',
      },
    },
  },
} satisfies Meta<typeof DefaultDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
