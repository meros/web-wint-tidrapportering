import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeekFilter, saveTimeReport, setWeekStatus } from '../api/timereport';
import type { FilterResponse, SaveDayEntry } from '../api/timereport';
import { getWeekDays, getISOWeek } from '../utils/date';

export interface DayData {
  hours: number | null;
  locked: boolean;
  dirty: boolean;
  internalNote: string;
  externalNote: string;
}

export interface ProjectWeekData {
  projectId: string;
  projectName: string;
  categoryId: number;
  categoryName: string;
  locked: boolean;
  days: DayData[];
}

function emptyDay(): DayData {
  return { hours: null, locked: false, dirty: false, internalNote: '', externalNote: '' };
}

/** Parse the Filter endpoint response into flat project rows */
function parseFilterResponse(data: FilterResponse, monday: Date): { projects: ProjectWeekData[]; weekLocked: boolean } {
  const weekDays = getWeekDays(monday);
  const projects: ProjectWeekData[] = [];

  // Determine week-level lock status from WeekSegments
  let weekLocked = false;
  const week = data.Weeks?.[0];
  if (week) {
    const seg = week.WeekSegments?.[0];
    if (seg && seg.WeekSegmentStatus >= 1) {
      weekLocked = true;
    }
  }

  if (!week?.TimeReports) return { projects, weekLocked };

  for (const dayReport of week.TimeReports) {
    const reportDate = new Date(dayReport.TimeLogDate);
    const dayIdx = weekDays.findIndex(
      (d) =>
        d.getFullYear() === reportDate.getFullYear() &&
        d.getMonth() === reportDate.getMonth() &&
        d.getDate() === reportDate.getDate(),
    );
    if (dayIdx < 0) continue;

    for (const pt of dayReport.ProjectTimes) {
      for (const ct of pt.CategoryTimes) {
        let row = projects.find(
          (p) => p.projectId === pt.ProjectId && p.categoryId === ct.CategoryId,
        );

        if (!row) {
          row = {
            projectId: pt.ProjectId,
            projectName: pt.ProjectName,
            categoryId: ct.CategoryId,
            categoryName: ct.CategoryName,
            locked: false,
            days: weekDays.map(() => emptyDay()),
          };
          projects.push(row);
        }

        row.days[dayIdx] = {
          hours: ct.Hours || null,
          locked: ct.IsLocked,
          dirty: false,
          internalNote: ct.InternalComment ?? '',
          externalNote: ct.ExternalComment ?? '',
        };

        if (ct.IsLocked) {
          row.locked = true;
        }
      }
    }
  }

  return { projects, weekLocked };
}

/** Identity for a project+category combination */
interface KnownProject {
  projectId: string;
  projectName: string;
  categoryId: number;
  categoryName: string;
}

/** Merge parsed data with known projects so empty weeks still show rows */
function mergeWithKnownProjects(
  parsed: ProjectWeekData[],
  known: KnownProject[],
): ProjectWeekData[] {
  const result = [...parsed];

  for (const kp of known) {
    const exists = result.some(
      (p) => p.projectId === kp.projectId && p.categoryId === kp.categoryId,
    );
    if (!exists) {
      result.push({
        projectId: kp.projectId,
        projectName: kp.projectName,
        categoryId: kp.categoryId,
        categoryName: kp.categoryName,
        locked: false,
        days: Array.from({ length: 7 }, () => emptyDay()),
      });
    }
  }

  return result;
}

export function useTimeReport(
  jwt: string | null,
  companyId: string | null,
  employeeId: number | null,
  employeeName: string,
  monday: Date,
  sunday: Date,
) {
  const [projects, setProjects] = useState<ProjectWeekData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [weekLocked, setWeekLocked] = useState(false);
  const weekLockedRef = useRef(false);
  const knownProjectsRef = useRef<KnownProject[]>([]);
  const originalRef = useRef<ProjectWeekData[]>([]);

  // Fetch week data
  useEffect(() => {
    if (!jwt || !companyId || !employeeId) return;

    let cancelled = false;
    setLoading(true);

    fetchWeekFilter(employeeId, monday, sunday)
      .then((data) => {
        if (cancelled) return;
        const { projects: parsed, weekLocked: locked } = parseFilterResponse(data, monday);
        weekLockedRef.current = locked;
        setWeekLocked(locked);

        // Learn any new projects
        for (const p of parsed) {
          const alreadyKnown = knownProjectsRef.current.some(
            (kp) => kp.projectId === p.projectId && kp.categoryId === p.categoryId,
          );
          if (!alreadyKnown) {
            knownProjectsRef.current.push({
              projectId: p.projectId,
              projectName: p.projectName,
              categoryId: p.categoryId,
              categoryName: p.categoryName,
            });
          }
        }

        const merged = mergeWithKnownProjects(parsed, knownProjectsRef.current);
        originalRef.current = merged.map((p) => ({ ...p, days: p.days.map((d) => ({ ...d })) }));
        setProjects(merged);
        setDirty(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch time report:', err);
        if (knownProjectsRef.current.length > 0) {
          const empty = mergeWithKnownProjects([], knownProjectsRef.current);
          setProjects(empty);
        } else {
          setProjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jwt, companyId, employeeId, monday.getTime(), sunday.getTime()]);

  const updateHours = useCallback((projectIdx: number, dayIdx: number, value: number | null) => {
    setProjects((prev) =>
      prev.map((p, i) =>
        i === projectIdx
          ? {
              ...p,
              days: p.days.map((d, j) =>
                j === dayIdx ? { ...d, hours: value, dirty: true } : d,
              ),
            }
          : p,
      ),
    );
    setDirty(true);
  }, []);

  const updateComment = useCallback(
    (projectIdx: number, dayIdx: number, internal: string, external: string) => {
      setProjects((prev) =>
        prev.map((p, i) =>
          i === projectIdx
            ? {
                ...p,
                days: p.days.map((d, j) =>
                  j === dayIdx ? { ...d, internalNote: internal, externalNote: external, dirty: true } : d,
                ),
              }
            : p,
        ),
      );
      setDirty(true);
    },
    [],
  );

  const save = useCallback(async () => {
    if (!employeeId) return;

    setSaving(true);
    try {
      const weekDays = getWeekDays(monday);
      const end = new Date(monday);
      end.setDate(monday.getDate() + 6);
      const weekNumber = getISOWeek(monday);
      const entries: SaveDayEntry[] = [];

      for (const project of projects) {
        for (let di = 0; di < 7; di++) {
          const day = project.days[di];
          if (!day || !day.dirty) continue;
          const date = weekDays[di];
          if (!date) continue;

          entries.push({
            date,
            projectId: project.projectId,
            projectName: project.projectName,
            categoryId: project.categoryId,
            categoryName: project.categoryName,
            hours: day.hours ?? 0,
            internalComment: day.internalNote || '',
            externalComment: day.externalNote || '',
          });
        }
      }

      if (entries.length > 0) {
        await saveTimeReport(employeeId, employeeName, monday, end, weekNumber, entries);
      }

      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          days: p.days.map((d) => ({ ...d, dirty: false })),
        })),
      );
      setDirty(false);
    } catch (err) {
      console.error('Failed to save:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projects, employeeId, employeeName, monday]);

  const toggleLock = useCallback(async () => {
    if (!employeeId) return;

    const end = new Date(monday);
    end.setDate(monday.getDate() + 6);
    const currentlyLocked = weekLockedRef.current;
    const newStatus = currentlyLocked ? 0 : 1;

    try {
      await setWeekStatus(employeeId, monday, end, newStatus);
      // Re-fetch to get updated lock state on all entries
      const data = await fetchWeekFilter(employeeId, monday, end);
      const { projects: parsed, weekLocked: locked } = parseFilterResponse(data, monday);
      weekLockedRef.current = locked;
      setWeekLocked(locked);
      const merged = mergeWithKnownProjects(parsed, knownProjectsRef.current);
      originalRef.current = merged.map((p) => ({ ...p, days: p.days.map((d) => ({ ...d })) }));
      setProjects(merged);
      setDirty(false);
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  }, [employeeId, monday]);

  const reset = useCallback(() => {
    setProjects(originalRef.current.map((p) => ({ ...p, days: p.days.map((d) => ({ ...d })) })));
    setDirty(false);
  }, []);

  return { projects, loading, saving, dirty, weekLocked, updateHours, updateComment, save, toggleLock, reset };
}
