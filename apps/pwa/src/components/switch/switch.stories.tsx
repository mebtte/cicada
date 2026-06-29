import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Switch, { type SwitchProps } from '.';

function ControlledSwitch({
  checked: initialChecked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const [checked, setChecked] = useState(initialChecked);

  useEffect(() => {
    setChecked(initialChecked);
  }, [initialChecked]);

  return (
    <Switch
      {...props}
      checked={checked}
      onCheckedChange={(nextChecked) => {
        setChecked(nextChecked);
        onCheckedChange?.(nextChecked);
      }}
    />
  );
}

const meta = {
  title: 'Basic/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Controlled switch for boolean settings, migrated from the repeated page-level PWA switch implementations.',
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Current checked state.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables user interaction.',
    },
    onCheckedChange: {
      action: 'checked change',
      description: 'Called with the next checked value after click.',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for icon-only switch usage.',
    },
  },
  args: {
    checked: false,
    disabled: false,
    'aria-label': 'Switch setting',
  },
  render: (args) => <ControlledSwitch {...args} />,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { checked: false },
};

export const On: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },
};

export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <Switch
        checked={checked}
        aria-label="Enable admin quick edit"
        onCheckedChange={setChecked}
      />
    );
  },
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content max-content',
        alignItems: 'center',
        gap: 14,
        color: 'rgb(75 75 75)',
        fontFamily: "'Nunito', 'Varela Round', system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 800,
      }}
    >
      <span>Off</span>
      <ControlledSwitch checked={false} aria-label="Off example" />
      <span>On</span>
      <ControlledSwitch checked aria-label="On example" />
      <span>Disabled</span>
      <ControlledSwitch checked disabled aria-label="Disabled example" />
    </div>
  ),
};
