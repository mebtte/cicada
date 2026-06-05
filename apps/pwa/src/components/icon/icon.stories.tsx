import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  CheckCircle,
  Close,
  Edit,
  Export,
  ExternalLink,
  List,
  MusicNote,
  PlayArrow,
  PlayQueue,
} from '.';
import type { IconProps } from '.';

const ALL_ICONS: { name: string; Component: (p: Omit<IconProps, 'children'>) => React.ReactElement }[] = [
  { name: 'List',         Component: List         },
  { name: 'PlayQueue',    Component: PlayQueue    },
  { name: 'Edit',         Component: Edit         },
  { name: 'ExternalLink', Component: ExternalLink },
  { name: 'Export',       Component: Export       },
  { name: 'CheckCircle',  Component: CheckCircle  },
  { name: 'Close',        Component: Close        },
  { name: 'PlayArrow',    Component: PlayArrow    },
  { name: 'MusicNote',    Component: MusicNote    },
];

const meta = {
  title: 'Basic/Icon',
  component: List,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Stroke-based SVG icons. Each icon is an independent file — unused icons are tree-shaken out of the bundle. ' +
          'Import named icons directly: `import { PlayQueue } from "@/components/icon"`. ' +
          'To add a new icon, create a file under `icons/` and add one export line to `index.ts`.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 12, max: 64, step: 2 },
      description: 'Icon size in px',
      table: { defaultValue: { summary: '24' } },
    },
    strokeWidth: {
      control: { type: 'range', min: 1, max: 4, step: 0.5 },
      description: 'Stroke width',
      table: { defaultValue: { summary: '2.2' } },
    },
    color: {
      control: 'color',
      description: 'Icon color (maps to CSS currentColor)',
      table: { defaultValue: { summary: 'currentColor' } },
    },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

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

// keyline 可视化, 看每个图标艺术稿是不是落在 4..20 视觉框内
export const Keyline: Story = {
  name: 'Keyline (debug)',
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
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            {/* 4..20 keyline 框 (按 72px 显示比例: 4/24*72=12, 16/24*72=48) */}
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: 12,
                width: 48,
                height: 48,
                outline: '1px dashed rgba(255,99,99,0.5)',
              }}
            />
            <Component size={72} color="rgb(44 182 125)" />
          </div>
          <span style={{ fontSize: 10, color: '#aaa', textAlign: 'center', lineHeight: 1.3 }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const Playground: Story = {
  args: { size: 24, strokeWidth: 2.2 },
};

export const Sizes: Story = {
  name: 'Sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
      {[16, 20, 24, 32, 40].map((s) => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <PlayQueue size={s} />
          <span style={{ fontSize: 10, color: '#999' }}>{s}</span>
        </div>
      ))}
    </div>
  ),
};

export const StrokeWeights: Story = {
  name: 'Stroke Weights',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      {[1, 1.5, 2, 2.5, 3].map((w) => (
        <div key={w} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <PlayQueue size={28} strokeWidth={w} />
          <span style={{ fontSize: 10, color: '#999' }}>{w}</span>
        </div>
      ))}
    </div>
  ),
};
