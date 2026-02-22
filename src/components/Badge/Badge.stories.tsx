import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info', 'locked'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Utkast' },
};

export const Success: Story = {
  args: { children: 'Sparad', variant: 'success' },
};

export const Warning: Story = {
  args: { children: 'Ej sparad', variant: 'warning' },
};

export const Error: Story = {
  args: { children: 'Fel', variant: 'error' },
};

export const Info: Story = {
  args: { children: 'Fakturerad', variant: 'info' },
};

export const Locked: Story = {
  args: { children: 'Låst', variant: 'locked' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge>Utkast</Badge>
      <Badge variant="success">Sparad</Badge>
      <Badge variant="warning">Ej sparad</Badge>
      <Badge variant="error">Fel</Badge>
      <Badge variant="info">Fakturerad</Badge>
      <Badge variant="locked">Låst</Badge>
    </div>
  ),
};
