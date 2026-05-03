import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from '.';
import Button from '../button';
import Input from '../input';

const meta = {
  title: 'Basic/Dialog',
  component: DialogContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible dialog built on **@radix-ui/react-dialog**. ' +
          'On mobile (< 640 px) it renders as a bottom sheet; on desktop it appears as a centered modal. ' +
          'Compose with `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, and `DialogFooter`.',
      },
    },
  },
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Basic ────────────────────────────────────────────────────────────────────

export const Basic: Story = {
  name: 'Basic',
  parameters: { controls: { disable: true } },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete playlist</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The playlist will be permanently
              removed from your library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

// ─── With form ────────────────────────────────────────────────────────────────

export const WithForm: Story = {
  name: 'With form',
  parameters: { controls: { disable: true } },
  render: () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">Create playlist</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New playlist</DialogTitle>
            <DialogDescription>
              Give your playlist a name to get started.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Input
              label="Playlist name"
              placeholder="My awesome playlist…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              disabled={!name.trim()}
              onClick={() => setOpen(false)}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

// ─── Long content (scroll) ────────────────────────────────────────────────────

export const LongContent: Story = {
  name: 'Long content (scroll)',
  parameters: { controls: { disable: true } },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">Terms &amp; conditions</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>Last updated April 2026</DialogDescription>
          </DialogHeader>
          <DialogBody>
            {Array.from({ length: 12 }, (_, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "'Nunito', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgb(80 80 80)',
                  lineHeight: 1.65,
                  margin: '0 0 14px',
                }}
              >
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button variant="primary" onClick={() => setOpen(false)}>
              I agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

// ─── No close button ──────────────────────────────────────────────────────────

export const NoCloseButton: Story = {
  name: 'No close button',
  parameters: { controls: { disable: true } },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">Open (no × button)</Button>
        </DialogTrigger>
        <DialogContent showClose={false}>
          <DialogHeader>
            <DialogTitle>Processing…</DialogTitle>
            <DialogDescription>
              Please wait while we upload your file. Do not close this window.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
