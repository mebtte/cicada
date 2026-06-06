import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Pagination from '.';

const meta = {
  title: 'Basic/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Pagination strip with previous/next, optional first/last jump buttons, sibling and boundary pages, and ellipsis markers. Selected page renders as the primary Button variant; others use the plain variant with the same hover/press feel.',
      },
    },
  },
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 50 } },
    page: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
    boundaryCount: { control: { type: 'number', min: 1, max: 3 } },
    showFirstButton: { control: 'boolean' },
    showLastButton: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    count: 10,
    page: 1,
    siblingCount: 1,
    boundaryCount: 1,
    showFirstButton: false,
    showLastButton: false,
    disabled: false,
    size: 'sm',
    onChange: () => {},
  },
  render: (args) => {
    const [page, setPage] = useState(args.page);
    return <Pagination {...args} page={page} onChange={setPage} />;
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ManyPages: Story = {
  name: 'Many pages (with ellipsis)',
  args: { count: 30, page: 12 },
};

export const WithFirstLast: Story = {
  name: 'First / Last buttons',
  args: { count: 20, page: 10, showFirstButton: true, showLastButton: true },
};

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    function Row({ size }: { size: 'sm' | 'md' | 'lg' }) {
      const [page, setPage] = useState(3);
      return (
        <Pagination count={8} page={page} onChange={setPage} size={size} />
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Row key={size} size={size} />
        ))}
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { count: 8, page: 3, disabled: true },
};
