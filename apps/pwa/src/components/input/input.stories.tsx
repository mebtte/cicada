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
          'Text input field with Duolingo-style hard shadow. Supports prefix/suffix slots, label, hint and error messages. Built with `forwardRef` for compatibility with form libraries like React Hook Form.',
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
    label:       { control: 'text', description: 'Label rendered above the input' },
    placeholder: { control: 'text', description: 'Placeholder text' },
    hint:        { control: 'text', description: 'Helper text shown below (hidden when error is set)' },
    error:       { control: 'text', description: 'Error message — also triggers the error visual state' },
    disabled:    { control: 'boolean', description: 'Disabled state' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username...',
    hint: 'Letters and numbers only',
  },
};

export const States: Story = {
  name: 'States',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input label="Default"   placeholder="Placeholder..." />
      <Input label="With hint" placeholder="Type something..." hint="This is a hint message" />
      <Input label="Error"     placeholder="Type something..." error="This field is required" />
      <Input label="Disabled"  placeholder="Not editable"     disabled />
    </div>
  ),
};

export const Sizes: Story = {
  name: 'Sizes',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input size="sm" label="Small"  placeholder="Small input..."  />
      <Input size="md" label="Medium" placeholder="Medium input..." />
      <Input size="lg" label="Large"  placeholder="Large input..."  />
    </div>
  ),
};

export const Affixes: Story = {
  name: 'Prefix & Suffix',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input
        label="Search"
        placeholder="Search music..."
        prefix={<span style={{ fontSize: 16 }}>🔍</span>}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter password..."
        suffix={<span style={{ fontSize: 14, cursor: 'pointer' }}>👁</span>}
      />
      <Input
        label="Price"
        placeholder="0.00"
        prefix={<span style={{ fontSize: 13, fontWeight: 700 }}>¥</span>}
        suffix={<span style={{ fontSize: 11, color: '#aaa' }}>CNY</span>}
      />
    </div>
  ),
};
