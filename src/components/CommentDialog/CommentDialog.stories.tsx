import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CommentDialog } from './CommentDialog';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/CommentDialog',
  component: CommentDialog,
} satisfies Meta<typeof CommentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    dayLabel: 'Ons 19/2',
    internalNote: '',
    externalNote: '',
    onSave: () => {},
    onClose: () => {},
  },
};

export const WithExistingNotes: Story = {
  args: {
    open: true,
    dayLabel: 'Tor 20/2',
    internalNote: 'Jobbade hemifrån',
    externalNote: 'API-integrering Sprint 14',
    onSave: () => {},
    onClose: () => {},
  },
};

export const Interactive: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState({ internal: '', external: '' });
    return (
      <>
        <Button onClick={() => setOpen(true)}>Öppna kommentar</Button>
        {notes.internal && <p style={{ marginTop: 8 }}>Intern: {notes.internal}</p>}
        {notes.external && <p>Extern: {notes.external}</p>}
        <CommentDialog
          open={open}
          dayLabel="Mån 17/2"
          internalNote={notes.internal}
          externalNote={notes.external}
          onSave={(i, e) => {
            setNotes({ internal: i, external: e });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </>
    );
  },
};
