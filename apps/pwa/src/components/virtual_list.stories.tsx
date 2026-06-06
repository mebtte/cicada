import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import VirtualList from './virtual_list';

const ROWS = Array.from({ length: 10_000 }, (_, index) => ({
  id: `row-${index}`,
  title: `Item #${index + 1}`,
  subtitle: `Generated subtitle ${(index * 7) % 9999}`,
}));

function TenThousandDemo() {
  return (
    <VirtualList
      count={ROWS.length}
      getItemKey={(index) => ROWS[index].id}
      style={{
        width: 360,
        height: 480,
        border: '1px solid #eee',
        borderRadius: 12,
      }}
      renderItem={(index) => {
        const item = ROWS[index];
        return (
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f3f3f3',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <div style={{ fontWeight: 700, color: '#333' }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {item.subtitle}
            </div>
          </div>
        );
      }}
    />
  );
}

function ExternalScrollDemo() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={scrollRef}
      style={{
        width: 360,
        height: 480,
        overflowY: 'auto',
        border: '1px solid #eee',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          padding: 16,
          background: '#fafafa',
          fontWeight: 800,
          color: '#666',
        }}
      >
        Sticky-ish header (lives in scroll container)
      </div>
      <VirtualList
        scrollElementRef={scrollRef}
        count={2_000}
        getItemKey={(index) => `ext-${index}`}
        renderItem={(index) => (
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f3f3f3',
              fontFamily: 'system-ui, sans-serif',
              color: '#444',
            }}
          >
            External-scroll item #{index + 1}
          </div>
        )}
      />
    </div>
  );
}

const meta = {
  title: 'Utility/VirtualList',
  component: TenThousandDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Windowed list built on `@tanstack/react-virtual`. Renders only the rows in (or near) the viewport, keeping scroll smooth for very large datasets. Supports rendering inside its own scroll container, or attaching to an external scroll element via `scrollElementRef`.',
      },
    },
  },
} satisfies Meta<typeof TenThousandDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TenThousandRows: Story = {
  name: '10 000 rows',
};

export const ExternalScrollElement: Story = {
  name: 'External scroll element',
  render: () => <ExternalScrollDemo />,
};
