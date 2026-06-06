import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Textarea from './textarea';

const meta = {
  title: 'Form/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Plain multi-line text input. Highlights its border with the theme primary on focus and dims when disabled. Resize is disabled by default — wrap with your own container if you need an explicit height.',
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
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: { type: 'number', min: 1, max: 12 } },
  },
  args: {
    placeholder: 'Write something…',
    rows: 4,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Controlled: Story = {
  name: 'Controlled',
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = useState('Two roads diverged in a yellow wood…');
    return (
      <Textarea
        rows={5}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'You cannot edit me.',
  },
};
