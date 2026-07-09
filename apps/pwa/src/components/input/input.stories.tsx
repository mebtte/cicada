import type { Meta, StoryObj } from '@storybook/react';
import Input from '.';

const meta = {
  title: 'Basic/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Text input field with hard shadow. Supports label and error messages. Built with `forwardRef` for compatibility with form libraries like React Hook Form.',
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size — aligns with Button sizes',
      table: { defaultValue: { summary: 'md' } },
    },
    label: { control: 'text', description: 'Label rendered above the input' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    error: { control: 'text', description: 'Error message — also triggers the error visual state' },
    disabled: { control: 'boolean', description: 'Disabled state' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username...',
  },
};

export const States: Story = {
  name: 'States',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input label="Default" placeholder="Placeholder..." />
      <Input label="Error" placeholder="Type something..." error="This field is required" />
      <Input label="Disabled" placeholder="Not editable" disabled />
    </div>
  ),
};

export const Sizes: Story = {
  name: 'Sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input size="sm" label="Small" placeholder="Small input..." />
      <Input size="md" label="Medium" placeholder="Medium input..." />
      <Input size="lg" label="Large" placeholder="Large input..." />
    </div>
  ),
};
