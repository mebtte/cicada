import type { Meta, StoryObj } from '@storybook/react';
import Button from '.';
import { Add, Close, ExternalLink, PlayArrow } from '../icon';

const meta = {
  title: 'Basic/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Duolingo-style button with a hard bottom shadow and a satisfying press-down animation. Supports 4 variants (`primary`, `secondary`, `ghost`, `danger`), 3 sizes, loading and disabled states. Use `square` prop for icon-only buttons (replaces the old icon_button component).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual variant.',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size',
      table: { defaultValue: { summary: 'md' } },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state — disables interaction and shows a spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    block: {
      control: 'boolean',
      description: 'Stretch to full container width',
    },
    square: {
      control: 'boolean',
      description: 'Icon-only mode — forces aspect-ratio 1:1 and removes padding.',
    },
    children: {
      control: 'text',
      description: 'Button label',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Primary', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'Secondary', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'Ghost', variant: 'ghost' },
};

export const Danger: Story = {
  args: { children: 'Delete', variant: 'danger' },
};

export const Loading: Story = {
  args: { children: 'Loading...', variant: 'primary', loading: true },
};

export const Disabled: Story = {
  args: { children: 'Disabled', variant: 'primary', disabled: true },
};

export const Block: Story = {
  args: { children: 'Block Button', variant: 'primary', block: true },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const States: Story = {
  name: 'All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="primary">Default</Button>
        <Button variant="primary" loading>Loading</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="ghost">Default</Button>
        <Button variant="ghost" loading>Loading</Button>
        <Button variant="ghost" disabled>Disabled</Button>
      </div>
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button icon={<PlayArrow />}>Play</Button>
      <Button variant="secondary" icon={<Add />}>Add to List</Button>
      <Button variant="ghost" icon={<ExternalLink />}>Share</Button>
      <Button variant="danger" icon={<Close />}>Remove</Button>
    </div>
  ),
};

export const IconOnly: Story = {
  name: 'Icon Only (square)',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button square variant="ghost" size="sm">▶</Button>
      <Button square variant="ghost" size="md">▶</Button>
      <Button square variant="ghost" size="lg">▶</Button>
      <Button square variant="primary" size="sm">+</Button>
      <Button square variant="ghost" size="sm">↗</Button>
      <Button square variant="danger" size="sm">✕</Button>
    </div>
  ),
};
