import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Button from '@/components/button';
import { DrawerBody, DrawerHeader, DrawerTitle } from '@/components/drawer';
import AppDrawer from './index';

const meta = {
  title: 'App/AppDrawer',
  component: AppDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    width: {
      control: 'select',
      options: ['compact', 'medium', 'wide'],
    },
    includeTitlebarInset: { control: 'boolean' },
    showClose: { control: 'boolean' },
  },
  args: {
    width: 'medium',
    includeTitlebarInset: true,
    showClose: true,
    open: false,
    onClose: () => {},
    children: null,
  },
} satisfies Meta<typeof AppDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo(args: Story['args']) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <AppDrawer
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        accessibleTitle="App drawer"
      >
        <DrawerHeader>
          <DrawerTitle>App drawer</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          Drawer shell with titlebar inset and width presets centralized.
        </DrawerBody>
      </AppDrawer>
    </div>
  );
}

export const Default: Story = {
  render: (args) => <Demo {...args} />,
};
