import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Cover from '.';
import { Shape } from './constants';
import DefaultCover from '@/asset/default_cover.jpeg';

const meta = {
  title: 'Basic/Cover',
  component: Cover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Square cover image with three shape variants. Loading is lazy via IntersectionObserver — the default cover shows until the real image is decoded, then the new image crossfades in with a subtle scale and saturation pop.',
      },
    },
  },
  argTypes: {
    src: { control: 'text', description: 'Image URL.' },
    size: {
      control: { type: 'number', min: 32, max: 320, step: 8 },
      description: 'Width in px (or any CSS length).',
    },
    shape: {
      control: 'select',
      options: Object.values(Shape),
      description: 'Cover shape.',
    },
  },
  args: {
    src: DefaultCover,
    size: 160,
    shape: Shape.ROUNDED,
  },
} satisfies Meta<typeof Cover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllShapes: Story = {
  name: 'All shapes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
      {Object.values(Shape).map((shape) => (
        <div
          key={shape}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Cover src={DefaultCover} size={120} shape={shape} />
          <span style={{ fontSize: 11, color: '#999' }}>{shape}</span>
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
      {[48, 72, 96, 128, 160].map((size) => (
        <Cover key={size} src={DefaultCover} size={size} />
      ))}
    </div>
  ),
};

export const SwapSource: Story = {
  name: 'Swap source (crossfade)',
  parameters: { controls: { disable: true } },
  render: () => {
    const sources = [
      DefaultCover,
      'https://picsum.photos/seed/cicada-1/256',
      'https://picsum.photos/seed/cicada-2/256',
    ];
    const [index, setIndex] = useState(0);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Cover src={sources[index]} size={180} />
        <button
          type="button"
          onClick={() => setIndex((value) => (value + 1) % sources.length)}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 10,
            background: 'rgb(44 182 125)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Next cover
        </button>
      </div>
    );
  },
};

export const BrokenSource: Story = {
  name: 'Broken source (falls back)',
  args: {
    src: 'https://example.invalid/does-not-exist.jpg',
    size: 160,
  },
};
