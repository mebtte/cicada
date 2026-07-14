import type { Meta, StoryObj } from '@storybook/react';
import Avatar from '.';

// src/static 是 vite 的 publicDir, 资源以根路径托管, 直接引用 URL
const DefaultCover = '/apple-touch-icon_v1.png';

const meta = {
  title: 'Basic/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Duolingo-style avatar with a hard bottom shadow. When `onClick` is provided, the hover/press animation matches the Button component (hover lifts by 2px and deepens the shadow; press sinks by the shadow offset and flattens the shadow).',
      },
    },
  },
  argTypes: {
    src: { control: 'text', description: 'Image source URL' },
    size: {
      control: { type: 'number', min: 24, max: 200, step: 4 },
      description: 'Avatar size in px (or any CSS length string)',
      table: { defaultValue: { summary: '72' } },
    },
    active: {
      control: 'boolean',
      description: 'Highlight border & shadow with the primary color',
    },
  },
  args: {
    src: DefaultCover,
    size: 72,
    active: false,
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Active: Story = {
  args: { active: true },
};

export const Clickable: Story = {
  name: 'Clickable (hover / press)',
  parameters: {
    docs: {
      description: {
        story:
          'Hover lifts 2px and deepens the bottom shadow by 2px; press sinks by the full shadow offset and flattens the shadow — identical to Button.',
      },
    },
  },
  args: {
    onClick: () => {},
  },
};

export const ClickableActive: Story = {
  name: 'Clickable + Active',
  args: {
    active: true,
    onClick: () => {},
  },
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
      <Avatar {...args} size={40} />
      <Avatar {...args} size={56} />
      <Avatar {...args} size={72} />
      <Avatar {...args} size={96} />
      <Avatar {...args} size={128} />
    </div>
  ),
};

export const States: Story = {
  name: 'All States',
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
      <Avatar {...args} />
      <Avatar {...args} active />
      <Avatar {...args} onClick={() => {}} />
      <Avatar {...args} active onClick={() => {}} />
    </div>
  ),
};

export const ButtonParity: Story = {
  name: 'Button Parity (compare hover/press)',
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison: hover both to confirm the lift + shadow growth are identical, then press to confirm the sink + shadow flatten.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
      <Avatar {...args} onClick={() => {}} />
      <Avatar {...args} active onClick={() => {}} />
    </div>
  ),
};
