import type { Meta, StoryObj } from '@storybook/react';
import { WeekNav } from './WeekNav';

const meta = {
  title: 'Components/WeekNav',
  component: WeekNav,
} satisfies Meta<typeof WeekNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'V.8 · 17–23 feb 2026',
    onPrev: () => {},
    onNext: () => {},
    onToday: () => {},
  },
};

export const CrossMonth: Story = {
  args: {
    label: 'V.5 · 27 jan–2 feb 2026',
    onPrev: () => {},
    onNext: () => {},
    onToday: () => {},
  },
};
