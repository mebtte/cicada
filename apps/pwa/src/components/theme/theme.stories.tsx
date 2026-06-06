import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme, DEFAULT_THEME } from '.';
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

const SWATCHES = [
  { label: 'Default (green)', color: DEFAULT_THEME.colorPrimary },
  { label: 'Indigo',          color: 'rgb(99 102 241)' },
  { label: 'Crimson',         color: 'rgb(239 68 68)'  },
  { label: 'Amber',           color: 'rgb(245 158 11)' },
  { label: 'Sky',             color: 'rgb(14 165 233)' },
];

function SwatchesDemo() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        width: 600,
      }}
    >
      {SWATCHES.map(({ label, color }) => (
        <ThemeProvider key={color} theme={{ colorPrimary: color }}>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#fff',
              border: '1px solid #f0f0f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>
              {label}
            </span>
            <Spinner size={28} />
            <Button size="sm">Action</Button>
          </div>
        </ThemeProvider>
      ))}
    </div>
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
          'Theme context for color-primary-aware components. `ThemeProvider` accepts a partial theme and merges it with `DEFAULT_THEME`, exposing CSS variables on a `display:contents` wrapper so descendants pick up the new primary color without changing the layout.',
      },
    },
  },
} satisfies Meta<typeof DefaultDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Swatches: Story = {
  name: 'Color swatches',
  render: () => <SwatchesDemo />,
};
