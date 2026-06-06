import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useState } from 'react';
import Popup from './popup';
import Button from './button';

function PopupDemo({
  triggerLabel,
  children,
}: {
  triggerLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Popup open={open} onClose={() => setOpen(false)}>
        {children}
      </Popup>
    </>
  );
}

const meta = {
  title: 'Overlay/Popup',
  component: PopupDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bottom-sheet popup that slides up from the screen edge. Mounted to `document.body` via portal; clicking the mask closes it. For dialogs that need composition (header/body/footer), use `Dialog` instead.',
      },
    },
  },
  args: {
    triggerLabel: 'Open popup',
    children: null,
  },
} satisfies Meta<typeof PopupDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: (
      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16 }}>Quick actions</div>
        <div style={{ fontSize: 14, color: '#666' }}>
          Tap the mask to close.
        </div>
      </div>
    ),
  },
};

export const LongContent: Story = {
  name: 'Long content (scrolls)',
  args: {
    triggerLabel: 'Open scrollable popup',
    children: (
      <div style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
          Long content
        </div>
        {Array.from({ length: 30 }, (_, index) => (
          <p
            key={index}
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: '#555',
              margin: '0 0 10px',
            }}
          >
            Line {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing
            elit.
          </p>
        ))}
      </div>
    ),
  },
};
