import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WeekGrid } from './WeekGrid';
import type { ProjectWeekData } from '../../hooks/useTimeReport';

const monday = new Date(2026, 1, 16); // Mon 2026-02-16

function makeDays(hours: (number | null)[]): ProjectWeekData['days'] {
  return hours.map((h) => ({
    hours: h,
    locked: false,
    dirty: false,
    internalNote: '',
    externalNote: '',
  }));
}

const mockProjects: ProjectWeekData[] = [
  {
    projectId: 'p1',
    projectName: 'Solaris — normala timmar',
    categoryId: 12542,
    categoryName: 'Normaltid',
    locked: false,
    days: makeDays([8, 8, 8, 8, 8, null, null]),
  },
  {
    projectId: 'p2',
    projectName: 'Globex konsulttjänster',
    categoryId: 12543,
    categoryName: 'Normaltid',
    locked: false,
    days: makeDays([null, null, null, null, 2, null, null]),
  },
];

describe('WeekGrid', () => {
  it('shows loading state', () => {
    render(
      <WeekGrid
        monday={monday}
        projects={[]}
        loading={true}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    expect(screen.getByText('Laddar vecka...')).toBeInTheDocument();
  });

  it('shows empty state when no projects', () => {
    render(
      <WeekGrid
        monday={monday}
        projects={[]}
        loading={false}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    expect(screen.getByText(/Inga projekt/)).toBeInTheDocument();
  });

  it('renders project names', () => {
    render(
      <WeekGrid
        monday={monday}
        projects={mockProjects}
        loading={false}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    expect(screen.getByText('Solaris — normala timmar')).toBeInTheDocument();
    expect(screen.getByText('Globex konsulttjänster')).toBeInTheDocument();
  });

  it('renders day headers', () => {
    render(
      <WeekGrid
        monday={monday}
        projects={mockProjects}
        loading={false}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    expect(screen.getByText('Mån')).toBeInTheDocument();
    expect(screen.getByText('Tis')).toBeInTheDocument();
    expect(screen.getByText('Ons')).toBeInTheDocument();
    expect(screen.getByText('Tor')).toBeInTheDocument();
    expect(screen.getByText('Fre')).toBeInTheDocument();
    expect(screen.getByText('Lör')).toBeInTheDocument();
    expect(screen.getByText('Sön')).toBeInTheDocument();
  });

  it('renders hour values in cells', () => {
    render(
      <WeekGrid
        monday={monday}
        projects={mockProjects}
        loading={false}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    // There should be several spinbuttons with value 8
    const inputs = screen.getAllByRole('spinbutton');
    const eightInputs = inputs.filter((i) => (i as HTMLInputElement).value === '8');
    expect(eightInputs.length).toBe(5); // 5 days of 8h for first project
  });

  it('renders summary row with totals', () => {
    render(
      <WeekGrid
        monday={monday}
        projects={mockProjects}
        loading={false}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    expect(screen.getByText('Totalt')).toBeInTheDocument();
  });

  it('calls onHoursChange when cell value changes', async () => {
    const user = userEvent.setup();
    const onHoursChange = vi.fn();
    render(
      <WeekGrid
        monday={monday}
        projects={mockProjects}
        loading={false}
        onHoursChange={onHoursChange}
        onCommentChange={() => {}}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');
    // Change the first empty cell (first project, Saturday = index 5)
    // First project has 5 filled + 2 empty, second has 6 empty + 1 filled
    await user.clear(inputs[0]!);
    expect(onHoursChange).toHaveBeenCalled();
  });

  it('shows locked badge for locked projects', () => {
    const lockedProjects = [{ ...mockProjects[0]!, locked: true }, mockProjects[1]!];
    render(
      <WeekGrid
        monday={monday}
        projects={lockedProjects}
        loading={false}
        onHoursChange={() => {}}
        onCommentChange={() => {}}
      />,
    );
    expect(screen.getByText('Låst')).toBeInTheDocument();
  });
});
