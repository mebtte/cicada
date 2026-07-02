import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ImageViewer, { type ImageViewerPhoto } from '.';
import Button from '../button';
import DefaultCover from '@/static/apple-touch-icon_v1.png';

function ImageViewerDemo({ src, alt }: { src: string; alt: string }) {
  const [photo, setPhoto] = useState<ImageViewerPhoto | null>(null);
  return (
    <>
      <Button onClick={() => setPhoto({ src, alt })}>Open image viewer</Button>
      <ImageViewer photo={photo} onClose={() => setPhoto(null)} />
    </>
  );
}

const meta = {
  title: 'Overlay/ImageViewer',
  component: ImageViewerDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Full-screen lightbox with pinch / wheel / double-tap zoom (via `react-zoom-pan-pinch`). Backdrop click closes when not zoomed; the close button always closes. Use the toolbar buttons for zoom out, reset, and zoom in.',
      },
    },
  },
  args: {
    src: DefaultCover,
    alt: 'Default cover',
  },
} satisfies Meta<typeof ImageViewerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const RemoteImage: Story = {
  name: 'Remote image',
  args: {
    src: 'https://picsum.photos/seed/cicada-viewer/1600/1000',
    alt: 'Random landscape',
  },
};
