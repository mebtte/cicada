import type { Meta, StoryObj } from '@storybook/react';
import ErrorCard from './error_card';

const meta = {
  title: 'Basic/ErrorCard',
  component: ErrorCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Centered error placeholder with an illustrated image, message, and a primary "Retry" button. Use it as the fallback for failed data loads.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    errorMessage: {
      control: 'text',
      description: 'Human-readable error description.',
    },
    retry: { action: 'retry' },
  },
  args: {
    errorMessage: 'Network request failed. Check your connection and try again.',
    retry: () => {},
  },
} satisfies Meta<typeof ErrorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongMessage: Story = {
  name: 'Long message',
  args: {
    errorMessage:
      'Unable to reach the music server at https://music.example.com — the request timed out after 30 seconds. The server might be down or the URL might be misconfigured.',
  },
};

export const ShortMessage: Story = {
  name: 'Short message',
  args: { errorMessage: 'Unauthorized.' },
};
