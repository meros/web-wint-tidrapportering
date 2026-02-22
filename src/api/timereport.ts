import { apiRequest } from './client';
import { toApiDate } from '../utils/date';

// ── Filter endpoint types (GET /api/TimeReport/Filter) ──

export interface FilterResponse {
  EmployeeId: number;
  EmployeeName: string;
  Projects: FilterProject[];
  Weeks: FilterWeek[];
}

export interface FilterProject {
  Id: string;
  Name: string;
  IsInternal: boolean;
  Categories: Array<{
    Id: number;
    Name: string;
    IsDefault: boolean;
  }>;
}

export interface FilterWeek {
  WeekStart: string;
  WeekEnd: string;
  WeekNumber: number;
  TotalHours: number;
  ExpectedWorkHours: number;
  ExpectedCompHours: number;
  WeekSegments: Array<{
    WeekSegmentStatus: number;
    WeekSegmentStart: string;
    WeekSegmentEnd: string;
  }>;
  TimeReports: FilterTimeReport[];
}

export interface FilterTimeReport {
  TimeLogDate: string;
  WeekDayName: number;
  WeekNumber: number;
  IsWorkDay: boolean;
  TotalHours: number;
  IsLocked: boolean;
  TimeReduction: number;
  TimeReportStatus: number;
  ProjectTimes: FilterProjectTime[];
  Deviations: unknown[];
}

export interface FilterProjectTime {
  ProjectId: string;
  ProjectName: string;
  Hours: number;
  IsInternal: boolean;
  IsLocked: boolean;
  CategoryTimes: FilterCategoryTime[];
}

export interface FilterCategoryTime {
  CategoryId: number;
  CategoryName: string;
  Hours: number;
  IsLocked: boolean;
  ExternalComment: string | null;
  InternalComment: string | null;
}

// ── Fetch week data via Filter endpoint ──

export async function fetchWeekFilter(
  employeeId: number,
  startDate: Date,
  endDate: Date,
): Promise<FilterResponse> {
  const params = new URLSearchParams({
    employeeId: String(employeeId),
    startDate: toApiDate(startDate),
    endDate: toApiDate(endDate),
  });
  return apiRequest<FilterResponse>(`/TimeReport/Filter?${params}`);
}

// ── Lock / unlock ──

export async function setWeekStatus(
  employeeId: number,
  startDate: Date,
  endDate: Date,
  status: number,
): Promise<void> {
  await apiRequest('/TimeReport/Status', {
    method: 'PUT',
    body: {
      employeeId,
      startDate: toApiDate(startDate),
      endDate: toApiDate(endDate),
      status,
    },
  });
}

// ── Save (MergeTimeReport) ──

export interface SaveDayEntry {
  date: Date;
  projectId: string;
  projectName: string;
  categoryId: number;
  categoryName: string;
  hours: number;
  internalComment: string;
  externalComment: string;
}

function buildMergePayload(
  employeeId: number,
  employeeName: string,
  weekStart: Date,
  weekEnd: Date,
  weekNumber: number,
  entries: SaveDayEntry[],
) {
  // Collect unique projects
  const projectMap = new Map<string, { id: string; name: string; categories: Map<number, { id: number; name: string }> }>();
  for (const e of entries) {
    let proj = projectMap.get(e.projectId);
    if (!proj) {
      proj = { id: e.projectId, name: e.projectName, categories: new Map() };
      projectMap.set(e.projectId, proj);
    }
    if (!proj.categories.has(e.categoryId)) {
      proj.categories.set(e.categoryId, { id: e.categoryId, name: e.categoryName });
    }
  }

  const projects = Array.from(projectMap.values()).map((p) => ({
    id: p.id,
    name: p.name,
    startDate: toApiDate(weekStart),
    isInternal: false,
    categories: Array.from(p.categories.values()).map((c) => ({
      id: c.id,
      name: c.name,
      isDefault: true,
      startDate: toApiDate(weekStart),
    })),
  }));

  // Build 7 day entries (Mon-Sun)
  const timeReports = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayOfWeek = day.getDay();
    const isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5;

    const dayEntries = entries.filter(
      (e) =>
        e.date.getFullYear() === day.getFullYear() &&
        e.date.getMonth() === day.getMonth() &&
        e.date.getDate() === day.getDate(),
    );

    const projectTimesMap = new Map<string, { projectId: string; hours: number; categoryTimes: Array<{ categoryId: number; hours: number; isLocked: boolean; internalComment: string; externalComment: string }> }>();
    for (const e of dayEntries) {
      let pt = projectTimesMap.get(e.projectId);
      if (!pt) {
        pt = { projectId: e.projectId, hours: 0, categoryTimes: [] };
        projectTimesMap.set(e.projectId, pt);
      }
      pt.hours += e.hours;
      pt.categoryTimes.push({
        categoryId: e.categoryId,
        hours: e.hours,
        isLocked: false,
        internalComment: e.internalComment,
        externalComment: e.externalComment,
      });
    }

    const projectTimes = Array.from(projectTimesMap.values()).map((pt) => ({
      projectId: pt.projectId,
      isInternal: false,
      isLocked: false,
      hours: pt.hours,
      categoryTimes: pt.categoryTimes,
    }));

    const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);

    timeReports.push({
      timeLogDate: toApiDate(day),
      weekDayName: dayOfWeek,
      weekNumber,
      isWorkDay,
      totalHours,
      isLocked: false,
      timeReduction: 0,
      timeReportStatus: 0,
      projectTimes,
      deviations: [],
    });
  }

  const weekSegments = [
    {
      weekSegmentStatus: 0,
      weekSegmentStart: toApiDate(weekStart),
      weekSegmentEnd: toApiDate(weekEnd),
    },
  ];

  return {
    employeeId,
    employeeName,
    projects,
    weeks: [
      {
        weekStart: toApiDate(weekStart),
        weekEnd: toApiDate(weekEnd),
        weekNumber,
        totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
        expectedWorkHours: 40,
        expectedCompHours: -40,
        timeReports,
        weekSegments,
        lastWeekInMonthInfo: {
          isLastWeekInMonth: false,
          month: weekStart.getMonth() + 1,
        },
      },
    ],
  };
}

export async function saveTimeReport(
  employeeId: number,
  employeeName: string,
  weekStart: Date,
  weekEnd: Date,
  weekNumber: number,
  entries: SaveDayEntry[],
): Promise<void> {
  const payload = buildMergePayload(employeeId, employeeName, weekStart, weekEnd, weekNumber, entries);
  await apiRequest('/TimeReport/MergeTimeReport', {
    method: 'POST',
    body: payload,
  });
}
