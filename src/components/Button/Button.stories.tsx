import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'ghost', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Spara', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'Exportera', variant: 'secondary' },
};

export const Accent: Story = {
  args: { children: 'Ny rapport', variant: 'accent' },
};

export const Ghost: Story = {
  args: { children: 'Avbryt', variant: 'ghost' },
};

export const Outline: Story = {
  args: { children: 'Detaljer', variant: 'outline' },
};

export const Small: Story = {
  args: { children: 'Logga ut', variant: 'ghost', size: 'sm' },
};

export const Large: Story = {
  args: { children: 'Logga in med BankID', variant: 'primary', size: 'lg' },
};

export const Disabled: Story = {
  args: { children: 'Spara', variant: 'primary', disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
