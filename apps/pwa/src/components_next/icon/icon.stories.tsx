import type { Meta, StoryObj } from '@storybook/react';
import { IconList, IconPlayQueue } from '.';
import type { IconProps } from '.';

// ── Gallery 数据：新增 icon 后在这里加一行 ─────────────────────────────────────
const ALL_ICONS: { name: string; Component: (p: Omit<IconProps, 'children'>) => JSX.Element }[] = [
  { name: 'IconList',      Component: IconList      },
  { name: 'IconPlayQueue', Component: IconPlayQueue },
];

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Basic/Icon',
  component: IconList,           // 用于 autodocs 生成 props 表格
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '描边式 SVG 图标。每个 icon 是独立文件，支持 tree-shaking。\n\n' +
          '**使用方式**\n```tsx\nimport { IconPlayQueue } from \'@/components_next/icon\';\n<IconPlayQueue size={24} />\n```\n\n' +
          '**新增 icon**：在 `icons/` 目录新建文件，在 `index.ts` 加一行 export。',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 12, max: 64, step: 2 },
      table: { defaultValue: { summary: '24' } },
    },
    strokeWidth: {
      control: { type: 'range', min: 1, max: 4, step: 0.5 },
      table: { defaultValue: { summary: '2' } },
    },
    color: {
      control: 'color',
      table: { defaultValue: { summary: 'currentColor' } },
    },
  },
} satisfies Meta<typeof IconList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Gallery（文档首屏展示） ────────────────────────────────────────────────────

export const Gallery: Story = {
  name: 'Gallery',
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 96px)',
        gap: 4,
        width: '100%',
        maxWidth: 600,
      }}
    >
      {ALL_ICONS.map(({ name, Component }) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '16px 8px',
            borderRadius: 10,
            border: '1px solid #f0f0f0',
          }}
        >
          <Component size={24} color="rgb(44 182 125)" />
          <span style={{ fontSize: 10, color: '#aaa', textAlign: 'center', lineHeight: 1.3 }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};

// ── Playground ────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { size: 24, strokeWidth: 2 },
};

// ── Sizes ─────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
      {[16, 20, 24, 32, 40].map((s) => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <IconPlayQueue size={s} />
          <span style={{ fontSize: 10, color: '#999' }}>{s}</span>
        </div>
      ))}
    </div>
  ),
};

// ── Stroke Weights ────────────────────────────────────────────────────────────

export const StrokeWeights: Story = {
  name: 'Stroke Weights',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      {[1, 1.5, 2, 2.5, 3].map((w) => (
        <div key={w} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <IconPlayQueue size={28} strokeWidth={w} />
          <span style={{ fontSize: 10, color: '#999' }}>{w}</span>
        </div>
      ))}
    </div>
  ),
};
