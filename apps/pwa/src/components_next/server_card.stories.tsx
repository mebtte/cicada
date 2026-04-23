import type { Meta, StoryObj } from '@storybook/react';
import { type User } from '@/constants/server';
import { ServerCardItem } from '@/pages/login/first_step/server_card';

const meta = {
  title: 'Login/ServerCard',
  component: ServerCardItem,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'surface' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ServerCardItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Mock data ────────────────────────────────────────────────────────────────

function mockUser(id: string, nickname: string): User {
  return {
    id,
    nickname,
    username: nickname.toLowerCase(),
    avatar: '',
    joinTimestamp: 0,
    admin: false,
    musicbillOrders: [],
    musicbillMaxAmount: 100,
    createMusicMaxAmountPerDay: 10,
    musicPlayRecordIndate: 30,
    twoFAEnabled: false,
    token: 'mock-token',
  };
}

const ALL_USERS = [
  mockUser('1', 'Alice'),
  mockUser('2', 'Bob'),
  mockUser('3', 'Carol'),
  mockUser('4', 'Dave'),
  mockUser('5', 'Eve'),
  mockUser('6', 'Frank'),
  mockUser('7', 'Grace'),
  mockUser('8', 'Hank'),
  mockUser('9', 'Ivy'),
];

const BASE_PROPS = {
  hostname: 'My Music Server',
  origin: 'https://music.example.com',
  selectedUserId: '1',
  onClick: () => {},
  onDelete: () => {},
};

const CASES = [1, 3, 5, 8, 9] as const;

// ─── Individual stories ───────────────────────────────────────────────────────

export const OneUser: Story = {
  name: '1 user',
  args: { ...BASE_PROPS, users: ALL_USERS.slice(0, 1) },
};

export const ThreeUsers: Story = {
  name: '3 users',
  args: { ...BASE_PROPS, users: ALL_USERS.slice(0, 3) },
};

export const FiveUsers: Story = {
  name: '5 users',
  args: { ...BASE_PROPS, users: ALL_USERS.slice(0, 5) },
};

export const EightUsers: Story = {
  name: '8 users',
  args: { ...BASE_PROPS, users: ALL_USERS.slice(0, 8) },
};

export const NineUsers: Story = {
  name: '9 users (overflow)',
  args: { ...BASE_PROPS, users: ALL_USERS.slice(0, 9) },
};

// ─── All cases side by side ───────────────────────────────────────────────────

export const AllCases: Story = {
  name: 'All cases (1/3/5/8/9 users)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
      {CASES.map((n) => (
        <ServerCardItem
          key={n}
          hostname={`Server — ${n} user${n > 1 ? 's' : ''}`}
          origin="https://music.example.com"
          users={ALL_USERS.slice(0, n)}
          selectedUserId="1"
          onClick={() => {}}
          onDelete={() => {}}
        />
      ))}
    </div>
  ),
};
