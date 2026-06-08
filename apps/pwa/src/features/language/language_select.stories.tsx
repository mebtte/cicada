import type { Meta, StoryObj } from '@storybook/react';
import LanguageSelect from './language_select';

const meta = {
  title: 'Form/LanguageSelect',
  component: LanguageSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Language switcher backed by the global setting store. Selecting a new language updates the store and reloads the page so translations re-resolve. Note: in Storybook this *will* reload the preview iframe — that is the production behavior, not a bug.',
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
    label: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    confirmBeforeReload: {
      control: 'boolean',
      description: 'Open a confirmation dialog before applying & reloading.',
    },
  },
  args: {
    label: 'Language',
    confirmBeforeReload: false,
  },
} satisfies Meta<typeof LanguageSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithConfirm: Story = {
  name: 'Confirm before reload',
  args: { confirmBeforeReload: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
