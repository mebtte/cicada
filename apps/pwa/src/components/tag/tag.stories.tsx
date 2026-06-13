import type { Meta, StoryObj } from '@storybook/react';
import Tag from '.';
import { CheckCircle, Devices, Info } from '../icon';

const meta = {
  title: 'Basic/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Duolingo-style pill badge with the same hard-shadow formula as `Button`. Use it for read-only status, role, or type tags (e.g. "current device", "admin"). Supports 3 variants (`primary`, `neutral`, `danger`), 2 sizes, and an optional leading icon. Primary variant follows the per-server custom theme color.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'neutral', 'danger'],
      description: 'Visual variant.',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size — `sm` matches existing badges across the PWA.',
      table: { defaultValue: { summary: 'sm' } },
    },
    children: {
      control: 'text',
      description: 'Tag content',
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Current device', variant: 'primary' },
};

export const Neutral: Story = {
  args: { children: 'Read only', variant: 'neutral' },
};

export const Danger: Story = {
  args: { children: 'Revoked', variant: 'danger' },
};

export const AllVariants: Story = {
  name: 'All Variants',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Tag variant="primary">Primary</Tag>
      <Tag variant="neutral">Neutral</Tag>
      <Tag variant="danger">Danger</Tag>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All Sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Tag size="sm">Small</Tag>
      <Tag size="md">Medium</Tag>
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With Icon',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Tag icon={<Devices />}>Current device</Tag>
      <Tag variant="neutral" icon={<Info />}>
        Read only
      </Tag>
      <Tag variant="primary" icon={<CheckCircle />} size="md">
        Verified
      </Tag>
    </div>
  ),
};

export const InHeader: Story = {
  name: 'Beside a heading',
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800, color: 'rgb(88 88 88)' }}>
        MacBook Pro
      </span>
      <Tag>Current device</Tag>
    </div>
  ),
};
