import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from '.';
import Button from '../button';

const meta = {
  title: 'Layout/Drawer',
  component: DrawerContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Side panel with the same visual language as Dialog. Slides in from `left`, `right` (default), or `bottom`. Built on Radix UI Dialog for focus trapping, escape-to-close, and accessibility.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['left', 'right', 'bottom'],
      description: 'Which edge the drawer slides from.',
      table: { defaultValue: { summary: 'right' } },
    },
    showClose: {
      control: 'boolean',
      description: 'Show the close button.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof DrawerContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DrawerDemo({
  side = 'right',
  title = 'Drawer',
  description,
  showClose = false,
  longContent = false,
}: {
  side?: 'left' | 'right' | 'bottom';
  title?: string;
  description?: string;
  showClose?: boolean;
  longContent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open {title}</Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent side={side} showClose={showClose}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <DrawerBody>
            {longContent
              ? Array.from({ length: 20 }, (_, i) => (
                  <p key={i} style={{ margin: '0 0 12px' }}>
                    Item {i + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                ))
              : <p style={{ margin: 0 }}>Drawer content goes here.</p>}
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary" size="sm">Cancel</Button>
            </DrawerClose>
            <Button size="sm" onClick={() => setOpen(false)}>Confirm</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Right: Story = {
  name: 'Right (default)',
  render: () => (
    <DrawerDemo
      side="right"
      title="Right Drawer"
      description="Slides in from the right edge."
    />
  ),
};

export const Left: Story = {
  name: 'Left',
  render: () => (
    <DrawerDemo
      side="left"
      title="Left Drawer"
      description="Slides in from the left edge."
    />
  ),
};

export const Bottom: Story = {
  name: 'Bottom',
  render: () => (
    <DrawerDemo
      side="bottom"
      title="Bottom Drawer"
      description="Slides up from the bottom edge, full width."
    />
  ),
};

export const WithTrigger: Story = {
  name: 'With DrawerTrigger',
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Open via Trigger</Button>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>Triggered Drawer</DrawerTitle>
          <DrawerDescription>Opened via DrawerTrigger — no external state needed.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <p style={{ margin: 0 }}>Content area.</p>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary" size="sm">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const LongContent: Story = {
  name: 'Long content (scroll)',
  render: () => (
    <DrawerDemo
      side="right"
      title="Long Content"
      description="Scroll to see the footer stays accessible."
      longContent
    />
  ),
};

export const NoCloseButton: Story = {
  name: 'No close button',
  render: () => (
    <DrawerDemo
      side="right"
      title="No × Button"
      description="Use the Cancel button or press Escape to close."
      showClose={false}
    />
  ),
};

export const WithCloseButton: Story = {
  name: 'With close button',
  render: () => (
    <DrawerDemo
      side="right"
      title="Close Button"
      description="The optional close button uses the same hard-shadow button style."
      showClose
    />
  ),
};

export const AllSides: Story = {
  name: 'All sides',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['left', 'right', 'bottom'] as const).map((side) => (
        <DrawerDemo key={side} side={side} title={`${side[0].toUpperCase()}${side.slice(1)}`} />
      ))}
    </div>
  ),
};
