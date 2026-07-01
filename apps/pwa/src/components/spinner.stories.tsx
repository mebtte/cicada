import type { Meta, StoryObj } from '@storybook/react';
import Button from './button';
import Spinner from './spinner';

const meta = {
  title: 'Basic/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Beat loading indicator. Color follows the active theme primary by default, and can inherit the parent color with currentColor.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 12, max: 96, step: 4 },
      description: 'Square size in px.',
      table: { defaultValue: { summary: '24' } },
    },
  },
  args: { size: 24 },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  name: 'All sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {[16, 24, 32, 48, 64].map((size) => (
        <div
          key={size}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Spinner size={size} />
          <span style={{ fontSize: 11, color: '#999' }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const InsideButton: Story = {
  name: 'Inside button',
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <Button size="sm" loading>
        Saving
      </Button>
      <Button size="md" loading>
        Uploading
      </Button>
      <Button size="lg" loading>
        Importing
      </Button>
      <Button variant="ghost" loading>
        Refresh
      </Button>
    </div>
  ),
};
