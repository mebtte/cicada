import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Tooltip from './index';
import Button from '../button';

const meta = {
  title: 'Basic/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tooltip. Mouse hover shows the tooltip after a short delay; touch long press shows it after 500ms by default. Short taps on touch devices keep the tooltip hidden and pass the click through to the child element.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const ClickPassThrough: Story = {
  args: { content: '', children: <span /> },
  render: () => {
    const [count, setCount] = useState(0);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Tooltip content="Short taps increment the counter; long press shows this tooltip">
          <Button onClick={() => setCount((c) => c + 1)}>
            Clicks: {count}
          </Button>
        </Tooltip>
        <div style={{ color: 'rgb(140 140 140)', fontSize: 12 }}>
          Desktop: hover shows the tooltip; click increments the counter.
          <br />
          Touch: short tap increments the counter; long press shows the tooltip
          without clicking.
        </div>
      </div>
    );
  },
};

export const LongContent: Story = {
  args: {
    content:
      'This longer tooltip message demonstrates the maximum width and automatic line wrapping behavior.',
    children: <Button>Long content</Button>,
  },
};
