import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { WeekGrid } from './WeekGrid';
import type { ProjectWeekData } from '../../hooks/useTimeReport';

const meta = {
  title: 'Components/WeekGrid',
  component: WeekGrid,
} satisfies Meta<typeof WeekGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const monday = new Date(2026, 1, 16); // 2026-02-16

function makeDays(hours: (number | null)[]): ProjectWeekData['days'] {
  return hours.map((h) => ({
    hours: h,
    locked: false,
    dirty: false,
    internalNote: '',
    externalNote: '',
    projectTimeId: null,
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

export const Default: Story = {
  args: {
    monday,
    projects: mockProjects,
    loading: false,
    onHoursChange: () => {},
    onCommentChange: () => {},
  },
};

export const Loading: Story = {
  args: {
    monday,
    projects: [],
    loading: true,
    onHoursChange: () => {},
    onCommentChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    monday,
    projects: [],
    loading: false,
    onHoursChange: () => {},
    onCommentChange: () => {},
  },
};

export const WithLockedProject: Story = {
  args: {
    monday,
    projects: [
      {
        ...mockProjects[0]!,
        locked: true,
      },
      mockProjects[1]!,
    ],
    loading: false,
    onHoursChange: () => {},
    onCommentChange: () => {},
  },
};

export const WithComments: Story = {
  args: {
    monday,
    projects: [
      {
        ...mockProjects[0]!,
        days: mockProjects[0]!.days.map((d, i) =>
          i === 2 ? { ...d, internalNote: 'Jobbade hemifrån', externalNote: 'Sprint 14' } : d,
        ),
      },
      mockProjects[1]!,
    ],
    loading: false,
    onHoursChange: () => {},
    onCommentChange: () => {},
  },
};

export const Interactive: StoryObj = {
  render: () => {
    const [projects, setProjects] = useState<ProjectWeekData[]>(mockProjects);
    return (
      <WeekGrid
        monday={monday}
        projects={projects}
        loading={false}
        onHoursChange={(pi, di, val) => {
          setProjects((prev) =>
            prev.map((p, i) =>
              i === pi
                ? {
                    ...p,
                    days: p.days.map((d, j) =>
                      j === di ? { ...d, hours: val, dirty: true } : d,
                    ),
                  }
                : p,
            ),
          );
        }}
        onCommentChange={(pi, di, internal, external) => {
          setProjects((prev) =>
            prev.map((p, i) =>
              i === pi
                ? {
                    ...p,
                    days: p.days.map((d, j) =>
                      j === di ? { ...d, internalNote: internal, externalNote: external } : d,
                    ),
                  }
                : p,
            ),
          );
        }}
      />
    );
  },
};
