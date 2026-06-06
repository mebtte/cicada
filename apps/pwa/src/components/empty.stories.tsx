import type { Meta, StoryObj } from '@storybook/react';
import Empty from './empty';

const meta = {
  title: 'Basic/Empty',
  component: Empty,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Empty-state placeholder with a Duolingo-style "target" icon and a pop-in animation. Use it whenever a list or search result returns no items.',
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
    description: {
      control: 'text',
      description: 'Primary message shown under the icon.',
    },
    secondaryDescription: {
      control: 'text',
      description: 'Optional dimmer follow-up line.',
    },
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomMessage: Story = {
  name: 'Custom message',
  args: {
    description: 'Nothing here yet',
  },
};

export const WithSecondary: Story = {
  name: 'With secondary line',
  args: {
    description: 'No results',
    secondaryDescription: 'Try a different keyword or remove the active filters.',
  },
};
