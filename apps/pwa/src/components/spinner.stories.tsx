import type { Meta, StoryObj } from '@storybook/react';
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
          'Circular loading indicator. Color follows the active theme primary by default, and can inherit the parent color with currentColor.',
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
