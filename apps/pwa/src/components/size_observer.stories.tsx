import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import SizeObserver from './size_observer';

function ResizableDemo() {
  const [width, setWidth] = useState(320);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="range"
        min={120}
        max={600}
        value={width}
        onChange={(event) => setWidth(Number(event.target.value))}
      />
      <SizeObserver
        style={{
          width,
          height: 160,
          background: '#f4f4f4',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#444',
          fontWeight: 700,
        }}
      >
        {({ width: w, height: h }) => (
          <span>
            {Math.round(w)} × {Math.round(h)}
          </span>
        )}
      </SizeObserver>
    </div>
  );
}

const meta = {
  title: 'Utility/SizeObserver',
  component: ResizableDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Render-prop wrapper that measures its own offsetWidth / offsetHeight and re-renders children with the current size. Updates are throttled to avoid layout thrash. Skip rendering on the first pass — children only receive a size once measured.',
      },
    },
  },
} satisfies Meta<typeof ResizableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resizable: Story = {
  name: 'Resizable container',
};
