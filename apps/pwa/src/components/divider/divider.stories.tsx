import type { Meta, StoryObj } from '@storybook/react';
import Divider from '.';

const meta = {
  title: 'Basic/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Divider. Without a label renders a plain 2px horizontal rule. With a label renders an "OR"-style separator with the text centred between two lines.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'Optional text shown between the two lines. Omit for a plain rule.',
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  name: 'Plain',
  args: {},
};

export const WithLabel: Story = {
  name: 'With label',
  args: { label: 'or' },
};

export const CustomLabel: Story = {
  name: 'Custom label',
  args: { label: 'continue with' },
};
