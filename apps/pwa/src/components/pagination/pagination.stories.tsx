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
          'Pagination strip with previous/next, sibling pages, boundary pages, and ellipsis markers. Selected page renders as the primary Button variant; others use the plain variant with the same hover/press feel.',
      },
    },
  },
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 50 } },
    page: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
  },
  args: {
    count: 10,
    page: 1,
    siblingCount: 1,
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
