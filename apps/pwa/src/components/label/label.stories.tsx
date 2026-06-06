import type { Meta, StoryObj } from '@storybook/react';
import Label from '.';
import Input from '../input';

const meta = {
  title: 'Form/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Form field wrapper that stacks a heading row (label text + optional addon) above its content. Either pass children only (label text falls through), or pass a `label` plus a custom child. The `<label>` element forwards clicks/focus to the wrapped control.',
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
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithChildren: Story = {
  name: 'Wrapping an input',
  parameters: { controls: { disable: true } },
  render: () => (
    <Label label="Display name">
      <Input placeholder="e.g. Mebtte" />
    </Label>
  ),
};

export const TextOnly: Story = {
  name: 'Text only (no wrapped control)',
  parameters: { controls: { disable: true } },
  render: () => <Label>Email address</Label>,
};

export const WithAddon: Story = {
  name: 'With addon',
  parameters: { controls: { disable: true } },
  render: () => (
    <Label
      label="Password"
      addon={
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgb(44 182 125)',
            font: 'inherit',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Forgot?
        </button>
      }
    >
      <Input type="password" placeholder="••••••••" />
    </Label>
  ),
};
