import type { Meta, StoryObj } from '@storybook/react';
import { Login } from './Login';

const meta = {
  title: 'Components/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Login>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onLogin: () => {},
    onCancel: () => {},
    isLoggingIn: false,
    status: '',
    bankIdQr: null,
  },
};

export const WaitingForSession: Story = {
  args: {
    onLogin: () => {},
    onCancel: () => {},
    isLoggingIn: true,
    status: 'Startar BankID...',
    bankIdQr: null,
  },
};

export const QrCodeShown: Story = {
  args: {
    onLogin: () => {},
    onCancel: () => {},
    isLoggingIn: true,
    status: '',
    bankIdQr: {
      qrData: 'bankid.67df3917-fa0d-44e5-b327-edcc928297f8.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      autoStartToken: 'bdaccd84-6a98-4276-ba70-35e944b704af',
    },
  },
};

export const QrWithStatus: Story = {
  args: {
    onLogin: () => {},
    onCancel: () => {},
    isLoggingIn: true,
    status: 'Skriv in din säkerhetskod i BankID...',
    bankIdQr: {
      qrData: 'bankid.67df3917-fa0d-44e5-b327-edcc928297f8.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      autoStartToken: 'bdaccd84-6a98-4276-ba70-35e944b704af',
    },
  },
};
