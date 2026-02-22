import type { Meta, StoryObj } from '@storybook/react';
import { BankIdQr } from './BankIdQr';

const meta = {
  title: 'Components/BankIdQr',
  component: BankIdQr,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BankIdQr>;

export default meta;
type Story = StoryObj<typeof meta>;

// These are fake tokens — the QR code will render but won't be scannable by real BankID
export const Default: Story = {
  args: {
    qrData: 'bankid.67df3917-fa0d-44e5-b327-edcc928297f8.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    autoStartToken: 'bdaccd84-6a98-4276-ba70-35e944b704af',
    onCancel: () => {},
  },
};
