import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ErrorBoundary from './error_boundary';
import Button from './button';
import ErrorCard from './error_card';

function Bomb(): never {
  throw new Error('Something went wrong while rendering this widget.');
}

function ErrorBoundaryDemo() {
  const [exploded, setExploded] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  return (
    <div
      style={{
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <ErrorBoundary
        key={resetKey}
        fallback={(error) => (
          <ErrorCard
            errorMessage={error.message}
            retry={() => {
              setExploded(false);
              setResetKey((value) => value + 1);
            }}
          />
        )}
      >
        {exploded ? (
          <Bomb />
        ) : (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#f4f4f4',
              color: '#555',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Healthy child component
          </div>
        )}
      </ErrorBoundary>

      <Button
        variant="danger"
        onClick={() => setExploded(true)}
        disabled={exploded}
      >
        Throw error
      </Button>
    </div>
  );
}

const meta = {
  title: 'Utility/ErrorBoundary',
  component: ErrorBoundaryDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Class-based React error boundary. Renders `fallback(error)` if any descendant throws during render, and calls the optional `onError` callback (defaults to a logger). Re-mount the boundary (e.g. with a new key) to recover.',
      },
    },
  },
} satisfies Meta<typeof ErrorBoundaryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CatchesError: Story = {
  name: 'Catches a render error',
};
