import type { Meta, StoryObj } from '@storybook/react';
import AsyncContent from './index';

const meta = {
  title: 'App/AsyncContent',
  component: AsyncContent,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 220, border: '1px solid #eee' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AsyncContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: new Error('Failed to load data'),
    retry: () => {},
  },
};

export const Loaded: Story = {
  args: {
    children: <div style={{ padding: 20 }}>Loaded content</div>,
  },
};
