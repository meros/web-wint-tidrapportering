import type { Meta, StoryObj } from '@storybook/react';
import { HourCell } from './HourCell';

const meta = {
  title: 'Components/HourCell',
  component: HourCell,
  argTypes: {
    value: { control: 'number' },
    locked: { control: 'boolean' },
    dirty: { control: 'boolean' },
    today: { control: 'boolean' },
    weekend: { control: 'boolean' },
    hasComment: { control: 'boolean' },
  },
} satisfies Meta<typeof HourCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: null, onChange: () => {} },
};

export const WithValue: Story = {
  args: { value: 8, onChange: () => {} },
};

export const HalfHour: Story = {
  args: { value: 7.5, onChange: () => {} },
};

export const Dirty: Story = {
  args: { value: 8, dirty: true, onChange: () => {} },
};

export const Locked: Story = {
  args: { value: 8, locked: true, onChange: () => {} },
};

export const Today: Story = {
  args: { value: 6, today: true, onChange: () => {} },
};

export const Weekend: Story = {
  args: { value: null, weekend: true, onChange: () => {} },
};

export const WithComment: Story = {
  args: { value: 4, hasComment: true, onChange: () => {}, onCommentClick: () => {} },
};

export const WithCommentButton: Story = {
  args: { value: 8, onChange: () => {}, onCommentClick: () => {} },
};
