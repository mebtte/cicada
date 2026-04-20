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
          'Duolingo 漫画风格滑块：轨道带硬阴影描边，拇指（触摸设备）按下时下沉弹回，与 Button 使用同一套视觉公式。',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: '当前值（0 ~ max）',
    },
    max: {
      control: { type: 'number', min: 0.01 },
      description: '最大值',
      table: { defaultValue: { summary: '1' } },
    },
    edge: {
      control: 'select',
      options: ['rounded', 'square'],
      description: '轨道边缘风格',
      table: { defaultValue: { summary: 'rounded' } },
    },
    secondValue: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: '副轨道值（0–1），用于缓冲进度等场景',
    },
    disabled: {
      control: 'boolean',
      description: '禁用',
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

// ─── Controlled wrapper ───────────────────────────────────────────────────────

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

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Rounded: Story = {
  name: 'Rounded（默认）',
  args: { value: 0.45, edge: 'rounded' },
};

export const Square: Story = {
  name: 'Square',
  args: { value: 0.45, edge: 'square' },
};

export const WithBuffer: Story = {
  name: 'With Buffer（缓冲副轨）',
  args: { value: 0.3, secondValue: 0.65 },
};

export const Disabled: Story = {
  args: { value: 0.5, disabled: true },
};

export const Interactive: Story = {
  name: 'Interactive（可拖拽）',
  render: () => <Controlled initialValue={0.4} />,
};

export const InteractiveWithBuffer: Story = {
  name: 'Interactive with Buffer',
  render: () => <Controlled initialValue={0.25} secondValue={0.6} />,
};

// ─── Showcase ─────────────────────────────────────────────────────────────────

export const AllEdges: Story = {
  name: 'All Edges',
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
  name: 'Scenarios（使用场景）',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 300 }}>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          音量
        </div>
        <Slider value={0.75} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          播放进度（含缓冲）
        </div>
        <Slider value={0.3} edge="square" secondValue={0.65} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          禁用
        </div>
        <Slider value={0.5} disabled />
      </div>
    </div>
  ),
};
