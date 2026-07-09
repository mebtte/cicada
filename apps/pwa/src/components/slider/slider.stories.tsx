import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Slider from '.';

const meta = {
  title: 'Basic/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Slider: track with hard shadow outline, thumb presses down on interaction — same visual language as Button.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Current value (0 ~ max)',
    },
    max: {
      control: { type: 'number', min: 0.01 },
      description: 'Maximum value',
      table: { defaultValue: { summary: '1' } },
    },
    edge: {
      control: 'select',
      options: ['rounded', 'square'],
      description: 'Track end style',
      table: { defaultValue: { summary: 'rounded' } },
    },
    secondValue: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Secondary track value (0–1), e.g. buffer progress',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    onChange: { action: 'changed' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({
  initialValue = 0.4,
  secondValue,
  edge,
}: {
  initialValue?: number;
  secondValue?: number;
  edge?: 'rounded' | 'square';
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Slider value={value} onChange={setValue} secondValue={secondValue} edge={edge} />
      <div style={{ fontSize: 12, color: '#888', textAlign: 'center', fontFamily: 'monospace' }}>
        {(value * 100).toFixed(1)} %
      </div>
    </div>
  );
}

export const Rounded: Story = {
  args: { value: 0.45, edge: 'rounded' },
};

export const Square: Story = {
  args: { value: 0.45, edge: 'square' },
};

export const WithBuffer: Story = {
  name: 'With Buffer',
  args: { value: 0.3, secondValue: 0.65 },
};

export const Disabled: Story = {
  args: { value: 0.5, disabled: true },
};

export const Interactive: Story = {
  name: 'Interactive',
  args: { value: 0.4 },
  render: () => <Controlled initialValue={0.4} />,
};

export const InteractiveWithBuffer: Story = {
  name: 'Interactive with Buffer',
  args: { value: 0.25, secondValue: 0.6 },
  render: () => <Controlled initialValue={0.25} secondValue={0.6} />,
};

export const AllEdges: Story = {
  name: 'All Edges',
  args: { value: 0.6 },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 300 }}>
      {(['rounded', 'square'] as const).map((edge) => (
        <div key={edge}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {edge}
          </div>
          <Slider value={0.6} edge={edge} />
        </div>
      ))}
    </div>
  ),
};

export const Scenarios: Story = {
  name: 'Scenarios',
  args: { value: 0.75 },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 300 }}>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Volume
        </div>
        <Slider value={0.75} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Playback (with buffer)
        </div>
        <Slider value={0.3} edge="square" secondValue={0.65} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Disabled
        </div>
        <Slider value={0.5} disabled />
      </div>
    </div>
  ),
};
