import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: 'Solaris — normala timmar',
    children: 'Löpande konsulttimmar, 850 kr/h',
  },
};

export const Flat: Story = {
  args: {
    variant: 'flat',
    header: 'Sammanfattning',
    children: '40 timmar denna vecka',
  },
};

export const Accent: Story = {
  args: {
    variant: 'accent',
    header: 'OBS',
    children: 'Du har osparade ändringar',
  },
};
