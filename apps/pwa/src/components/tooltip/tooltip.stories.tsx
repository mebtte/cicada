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
          'Duolingo-style tooltip. 鼠标 hover 触发, 触屏长按 (默认 500ms) 触发; 触屏 short tap 不显示 tooltip, click 正常透传给子元素.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    content: '这是一段提示',
    children: <Button>悬浮我</Button>,
  },
};

export const Placements: Story = {
  args: { content: '', children: <span /> },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, auto)',
        gap: 16,
        padding: 80,
      }}
    >
      <Tooltip content="顶部" placement="top">
        <Button>top</Button>
      </Tooltip>
      <Tooltip content="底部" placement="bottom">
        <Button>bottom</Button>
      </Tooltip>
      <Tooltip content="左侧" placement="left">
        <Button>left</Button>
      </Tooltip>
      <Tooltip content="右侧" placement="right">
        <Button>right</Button>
      </Tooltip>
    </div>
  ),
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
        <Tooltip content="触屏 short tap 直接计数, 长按才显示我">
          <Button onClick={() => setCount((c) => c + 1)}>
            点击次数: {count}
          </Button>
        </Tooltip>
        <div style={{ color: 'rgb(140 140 140)', fontSize: 12 }}>
          桌面: 悬浮显示 tooltip, 点击计数 +1
          <br />
          移动: 短按计数 +1, 长按显示 tooltip 且不计数
        </div>
      </div>
    );
  },
};

export const LongContent: Story = {
  args: {
    content:
      '这是一段比较长的提示文本, 用来演示 tooltip 的最大宽度和自动换行能力',
    children: <Button>长文本</Button>,
  },
};

export const Disabled: Story = {
  args: {
    content: '你永远看不到我',
    disabled: true,
    children: <Button>禁用 tooltip</Button>,
  },
};
