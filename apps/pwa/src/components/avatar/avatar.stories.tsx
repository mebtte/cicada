import type { Meta, StoryObj } from '@storybook/react';
import DefaultCover from '@/asset/default_cover.jpeg';
import Avatar from '.';

const meta = {
  title: 'Basic/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
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

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
      <Avatar {...args} />
      <Avatar {...args} active />
      <Avatar {...args} size={112} />
    </div>
  ),
};
