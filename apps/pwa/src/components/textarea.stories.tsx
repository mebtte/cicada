import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Textarea from './textarea';

const meta = {
  title: 'Basic/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-line text input with the same border, shadow, radius and theme-aware focus treatment as Input.',
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Textarea size - aligns with Input and Button sizes',
      table: { defaultValue: { summary: 'md' } },
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    rows: { control: { type: 'number', min: 1, max: 12 } },
  },
  args: {
    placeholder: 'Write something...',
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
    const [value, setValue] = useState('Two roads diverged in a yellow wood...');
    return (
      <Textarea
        rows={5}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  },
};

export const States: Story = {
  name: 'States',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Textarea placeholder="Default textarea..." rows={4} />
      <Textarea
        error
        defaultValue="This content needs review."
        rows={4}
      />
      <Textarea
        disabled
        defaultValue="You cannot edit me."
        rows={4}
      />
    </div>
  ),
};

export const Sizes: Story = {
  name: 'Sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Textarea size="sm" placeholder="Small textarea..." rows={3} />
      <Textarea size="md" placeholder="Medium textarea..." rows={4} />
      <Textarea size="lg" placeholder="Large textarea..." rows={5} />
    </div>
  ),
};
