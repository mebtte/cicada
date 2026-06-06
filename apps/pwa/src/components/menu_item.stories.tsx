import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  MdSettings,
  MdPlaylistPlay,
  MdFavoriteBorder,
  MdLogout,
  MdChevronRight,
} from 'react-icons/md';
import MenuItem from './menu_item';

const meta = {
  title: 'Basic/MenuItem',
  component: MenuItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Row used in drawers, popups and menus. Renders an icon + label, with an optional suffix slot for chevrons, counts, or controls. Highlights with the theme primary color when `active`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 260,
          padding: 8,
          borderRadius: 12,
          background: '#fff',
          boxShadow: '0 8px 24px rgba(0 0 0 / 0.06)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    icon: <MdSettings size={20} />,
    label: 'Settings',
    active: false,
  },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: { active: true },
};

export const WithSuffix: Story = {
  name: 'With suffix',
  args: {
    icon: <MdPlaylistPlay size={20} />,
    label: 'Play queue',
    suffix: <MdChevronRight size={18} color="#bbb" />,
  },
};

export const InMenu: Story = {
  name: 'In a menu',
  parameters: { controls: { disable: true } },
  render: () => {
    const items = [
      { id: 'queue',     icon: <MdPlaylistPlay   size={20} />, label: 'Play queue' },
      { id: 'favorites', icon: <MdFavoriteBorder size={20} />, label: 'Favorites'  },
      { id: 'settings',  icon: <MdSettings       size={20} />, label: 'Settings'   },
      { id: 'logout',    icon: <MdLogout         size={20} />, label: 'Log out'    },
    ];
    const [activeId, setActiveId] = useState('favorites');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <MenuItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={item.id === activeId}
            onClick={() => setActiveId(item.id)}
          />
        ))}
      </div>
    );
  },
};
