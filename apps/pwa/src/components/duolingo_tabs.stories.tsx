import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DuolingoTabList, DuolingoTabPanels } from './duolingo_tabs';

enum DemoTab {
  MUSIC = 'music',
  SINGER = 'singer',
  LYRIC = 'lyric',
}

const tabList = [
  { tab: DemoTab.MUSIC, label: 'Music' },
  { tab: DemoTab.SINGER, label: 'Singer' },
  { tab: DemoTab.LYRIC, label: 'Lyric' },
];

const meta = {
  title: 'Basic/DuolingoTabs',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Duolingo-style tabs with an animated hard-shadow active block. Panels stay mounted so each tab keeps local state while switching.',
      },
    },
  },
} satisfies Meta<typeof ControlledTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulPanel({ label }: { label: string }) {
  const [value, setValue] = useState('');

  return (
    <div
      style={{
        height: 180,
        padding: 16,
        color: 'rgb(88 88 88)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 12 }}>{label}</div>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type here, then switch tabs"
        style={{
          width: '100%',
          height: 38,
          padding: '0 12px',
          border: '2px solid rgb(232 232 232)',
          borderRadius: 10,
        }}
      />
    </div>
  );
}

function ControlledTabs() {
  const [current, setCurrent] = useState(DemoTab.MUSIC);

  return (
    <div style={{ width: 360 }}>
      <DuolingoTabList<DemoTab>
        current={current}
        tabList={tabList}
        onChange={setCurrent}
      />
      <div style={{ height: 180, marginTop: 16 }}>
        <DuolingoTabPanels<DemoTab>
          current={current}
          tabList={[
            {
              tab: DemoTab.MUSIC,
              content: <StatefulPanel label="Music state" />,
            },
            {
              tab: DemoTab.SINGER,
              content: <StatefulPanel label="Singer state" />,
            },
            {
              tab: DemoTab.LYRIC,
              content: <StatefulPanel label="Lyric state" />,
            },
          ]}
        />
      </div>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <ControlledTabs />,
};
