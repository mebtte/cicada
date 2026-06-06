import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import FileSelect from './file_select';

const meta = {
  title: 'Form/FileSelect',
  component: FileSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Block-styled file picker built on the ghost Button. Shows the placeholder when empty and the filename when selected. Opens the native file picker on click — pass `acceptTypes` to filter the dialog.',
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
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    acceptTypes: { control: 'object' },
  },
  args: {
    value: null,
    onChange: () => {},
  },
  render: (args) => {
    const [file, setFile] = useState<File | null>(args.value);
    return <FileSelect {...args} value={file} onChange={setFile} />;
  },
} satisfies Meta<typeof FileSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithPlaceholder: Story = {
  name: 'Custom placeholder',
  args: { placeholder: 'Select cover image…' },
};

export const AudioOnly: Story = {
  name: 'Audio files only',
  args: { acceptTypes: ['audio/*'], placeholder: 'Select an audio file…' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const PreSelected: Story = {
  name: 'Pre-selected (mock)',
  args: {
    value: new File(['fake audio bytes'], 'midnight-rain.mp3', {
      type: 'audio/mpeg',
    }),
  },
};
