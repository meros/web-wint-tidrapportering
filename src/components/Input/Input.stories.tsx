import type { Meta, StoryObj } from '@storybook/react';
import { Input, Textarea } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Ange text...' },
};

export const WithLabel: Story = {
  args: { label: 'E-post', placeholder: 'namn@exempel.se', type: 'email' },
};

export const NumberInput: Story = {
  args: { type: 'number', placeholder: '0', style: { width: 80 } },
};

export const Small: Story = {
  args: { inputSize: 'sm', placeholder: 'Liten', style: { width: 80 } },
};

export const WithError: Story = {
  args: { label: 'Timmar', type: 'number', value: '-1', error: 'Kan inte vara negativt' },
};

export const TextareaStory: StoryObj<typeof Textarea> = {
  render: () => <Textarea label="Kommentar" placeholder="Skriv en kommentar..." />,
};
