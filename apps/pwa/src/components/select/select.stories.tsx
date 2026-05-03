import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select, MultiSelect } from '.';
import type { SelectOption } from '.';

// ─── Select ───────────────────────────────────────────────────────────────────

const meta = {
  title: 'Basic/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Single-value and multi-value picker. Same visual language as Button and Input — hard bottom shadow, rounded corners, Nunito font. ' +
          'Options accept any typed `value` (string, number, object). ' +
          'The dropdown is portalled to `document.body` to avoid clipping issues. ' +
          'Use `Select` for single choice and `MultiSelect` for multiple choices.',
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
      description: 'Select size — aligns with Button / Input sizes',
      table: { defaultValue: { summary: 'md' } },
    },
    placeholder: { control: 'text' },
    label:       { control: 'text' },
    hint:        { control: 'text' },
    error:       { control: 'text' },
    disabled:    { control: 'boolean' },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Data ─────────────────────────────────────────────────────────────────────

const FRUITS: SelectOption<string>[] = [
  { label: 'Apple',      value: 'apple'      },
  { label: 'Banana',     value: 'banana'     },
  { label: 'Cherry',     value: 'cherry'     },
  { label: 'Durian',     value: 'durian'     },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig',        value: 'fig'        },
];

const LANGUAGES: SelectOption<string>[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English',  value: 'en'    },
  { label: '日本語',   value: 'ja'    },
  { label: '한국어',   value: 'ko'    },
];

// ─── Stories ──────────────────────────────────────────────────────────────────

function Controlled({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState<string | undefined>(
    initialValue || undefined,
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Select
        label="Fruit"
        options={FRUITS}
        value={value}
        onChange={(v) => setValue(v)}
        placeholder="Pick a fruit..."
      />
      <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
        value: {JSON.stringify(value)}
      </div>
    </div>
  );
}

export const Playground: Story = {
  args: {
    options:     FRUITS,
    value:       'cherry',
    placeholder: 'Pick a fruit...',
    label:       'Fruit',
  },
};

export const Interactive: Story = {
  name: 'Interactive',
  args: { options: FRUITS },
  parameters: { controls: { disable: true } },
  render: () => <Controlled />,
};

export const States: Story = {
  name: 'States',
  args: { options: FRUITS },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Select
        label="Default"
        options={FRUITS}
        placeholder="Pick a fruit..."
      />
      <Select
        label="With value"
        options={FRUITS}
        value="cherry"
        placeholder="Pick a fruit..."
      />
      <Select
        label="With hint"
        options={FRUITS}
        placeholder="Pick a fruit..."
        hint="Choose your favourite"
      />
      <Select
        label="Error"
        options={FRUITS}
        placeholder="Pick a fruit..."
        error="This field is required"
      />
      <Select
        label="Disabled"
        options={FRUITS}
        value="apple"
        disabled
      />
    </div>
  ),
};

export const Sizes: Story = {
  name: 'Sizes',
  args: { options: FRUITS },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Select size="sm" label="Small"  options={FRUITS} value="apple"  />
      <Select size="md" label="Medium" options={FRUITS} value="banana" />
      <Select size="lg" label="Large"  options={FRUITS} value="cherry" />
    </div>
  ),
};

export const WithObjects: Story = {
  name: 'Object values',
  args: { options: FRUITS },
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = useState<string | undefined>('zh-CN');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Select
          label="Language"
          options={LANGUAGES}
          value={value}
          onChange={(v) => setValue(v)}
          hint="Changing language reloads the page"
        />
        <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
          value: {JSON.stringify(value)}
        </div>
      </div>
    );
  },
};

// ─── MultiSelect stories ──────────────────────────────────────────────────────

function MultiControlled() {
  const [value, setValue] = useState<SelectOption<string>[]>([
    { label: 'Apple', value: 'apple' },
    { label: 'Cherry', value: 'cherry' },
  ]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <MultiSelect
        label="Fruits"
        options={FRUITS}
        value={value}
        onChange={(vs) => setValue(vs)}
        placeholder="Pick fruits..."
      />
      <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
        value: {JSON.stringify(value)}
      </div>
    </div>
  );
}

export const Multi: Story = {
  name: 'MultiSelect — Interactive',
  args: { options: FRUITS },
  parameters: { controls: { disable: true } },
  render: () => <MultiControlled />,
};

export const MultiStates: Story = {
  name: 'MultiSelect — States',
  args: { options: FRUITS },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MultiSelect
        label="Empty"
        options={FRUITS}
        value={[]}
        placeholder="Pick fruits..."
      />
      <MultiSelect
        label="One selected"
        options={FRUITS}
        value={[{ label: 'Banana', value: 'banana' }]}
      />
      <MultiSelect
        label="Two selected"
        options={FRUITS}
        value={[{ label: 'Apple', value: 'apple' }, { label: 'Cherry', value: 'cherry' }]}
      />
      <MultiSelect
        label="Overflow (3+)"
        options={FRUITS}
        value={[
          { label: 'Apple', value: 'apple' },
          { label: 'Banana', value: 'banana' },
          { label: 'Cherry', value: 'cherry' },
          { label: 'Durian', value: 'durian' },
        ]}
      />
      <MultiSelect
        label="Error"
        options={FRUITS}
        value={[]}
        error="At least one item required"
      />
      <MultiSelect
        label="Disabled"
        options={FRUITS}
        value={[{ label: 'Apple', value: 'apple' }]}
        disabled
      />
    </div>
  ),
};
