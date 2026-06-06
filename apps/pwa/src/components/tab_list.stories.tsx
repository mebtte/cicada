import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import TabList from './tab_list';

enum DemoTab {
  ALL    = 'all',
  MUSIC  = 'music',
  SINGER = 'singer',
  LYRIC  = 'lyric',
}

const tabList = [
  { tab: DemoTab.ALL,    label: 'All'    },
  { tab: DemoTab.MUSIC,  label: 'Music'  },
  { tab: DemoTab.SINGER, label: 'Singer' },
  { tab: DemoTab.LYRIC,  label: 'Lyric'  },
];

function ControlledTabList() {
  const [current, setCurrent] = useState(DemoTab.ALL);
  return (
    <TabList<DemoTab>
      current={current}
      tabList={tabList}
      onChange={setCurrent}
    />
  );
}

const meta = {
  title: 'Basic/TabList (underline)',
  component: ControlledTabList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Lightweight underline-style tab strip. Each tab shows an underline indicator that slides under the active label. For the Duolingo-style chunky variant with managed panels, see `Basic/Tabs` instead.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ControlledTabList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
