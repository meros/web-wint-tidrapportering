import { useState, useCallback } from 'react';
import { HourCell } from '../HourCell/HourCell';
import { CommentDialog } from '../CommentDialog/CommentDialog';
import { Badge } from '../Badge/Badge';
import { getWeekDays, getDayName, formatShortDate, isToday, isWeekend } from '../../utils/date';
import type { ProjectWeekData } from '../../hooks/useTimeReport';
import './WeekGrid.css';

interface WeekGridProps {
  monday: Date;
  projects: ProjectWeekData[];
  loading: boolean;
  onHoursChange: (projectIdx: number, dayIdx: number, value: number | null) => void;
  onCommentChange: (projectIdx: number, dayIdx: number, internal: string, external: string) => void;
}

interface CommentTarget {
  projectIdx: number;
  dayIdx: number;
  dayLabel: string;
  internal: string;
  external: string;
}

const SHORT_DAY = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

export function WeekGrid({ monday, projects, loading, onHoursChange, onCommentChange }: WeekGridProps) {
  const days = getWeekDays(monday);
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);

  const openComment = useCallback(
    (projectIdx: number, dayIdx: number) => {
      const project = projects[projectIdx];
      if (!project) return;
      const day = project.days[dayIdx];
      const d = days[dayIdx];
      if (!d) return;
      setCommentTarget({
        projectIdx,
        dayIdx,
        dayLabel: `${getDayName(d)} ${formatShortDate(d)}`,
        internal: day?.internalNote ?? '',
        external: day?.externalNote ?? '',
      });
    },
    [projects, days],
  );

  if (loading) {
    return (
      <div className="week-grid">
        <div className="week-grid__loading">Laddar vecka...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="week-grid">
        <div className="week-grid__empty">Inga projekt att rapportera på denna vecka.</div>
      </div>
    );
  }

  // Calculate daily totals
  const dayTotals = days.map((_, di) =>
    projects.reduce((sum, p) => sum + (p.days[di]?.hours ?? 0), 0),
  );
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="week-grid">
        <table className="week-grid__table">
          <thead>
            <tr>
              <th className="week-grid__th week-grid__th--project">Projekt</th>
              {days.map((d, i) => (
                <th
                  key={i}
                  className={`week-grid__th ${isToday(d) ? 'week-grid__th--today' : ''} ${isWeekend(d) ? 'week-grid__th--weekend' : ''}`}
                >
                  <span className="week-grid__day-name">{getDayName(d)}</span>
                  <span className="week-grid__day-date">{formatShortDate(d)}</span>
                </th>
              ))}
              <th className="week-grid__th week-grid__th--total">&Sigma;</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, pi) => {
              const rowTotal = project.days.reduce((sum, d) => sum + (d?.hours ?? 0), 0);
              return (
                <tr key={project.projectId + '-' + project.categoryId} className="week-grid__row">
                  <td className="week-grid__project-cell">
                    <div className="week-grid__project-name">{project.projectName}</div>
                    <div className="week-grid__category-name">
                      {project.categoryName}
                      {project.locked && (
                        <Badge variant="locked" style={{ marginLeft: 6 }}>Låst</Badge>
                      )}
                    </div>
                    {/* Mobile: inline day grid */}
                    <div className="week-grid__mobile-days">
                      {days.map((d, di) => {
                        const hasNote = !!(project.days[di]?.internalNote || project.days[di]?.externalNote);
                        return hasNote ? (
                          <button
                            key={`label-${di}`}
                            type="button"
                            className={`week-grid__mobile-day-label week-grid__mobile-day-label--note ${isToday(d) ? 'week-grid__mobile-day-label--today' : ''}`}
                            onClick={() => openComment(pi, di)}
                            tabIndex={-1}
                          >
                            {SHORT_DAY[di]} ✎
                          </button>
                        ) : (
                          <span
                            key={`label-${di}`}
                            className={`week-grid__mobile-day-label ${isToday(d) ? 'week-grid__mobile-day-label--today' : ''}`}
                          >
                            {SHORT_DAY[di]}
                          </span>
                        );
                      })}
                      {days.map((d, di) => (
                        <HourCell
                          key={`input-${di}`}
                          value={project.days[di]?.hours ?? null}
                          locked={project.locked || (project.days[di]?.locked ?? false)}
                          dirty={project.days[di]?.dirty ?? false}
                          today={isToday(d)}
                          weekend={isWeekend(d)}
                          hasComment={!!(project.days[di]?.internalNote || project.days[di]?.externalNote)}
                          onChange={(val) => onHoursChange(pi, di, val)}
                          onCommentClick={() => openComment(pi, di)}
                          compact
                        />
                      ))}
                    </div>
                  </td>
                  {/* Desktop day cells */}
                  {days.map((d, di) => (
                    <td key={di} className="week-grid__hour-cell">
                      <HourCell
                        value={project.days[di]?.hours ?? null}
                        locked={project.locked || (project.days[di]?.locked ?? false)}
                        dirty={project.days[di]?.dirty ?? false}
                        today={isToday(d)}
                        weekend={isWeekend(d)}
                        hasComment={!!(project.days[di]?.internalNote || project.days[di]?.externalNote)}
                        onChange={(val) => onHoursChange(pi, di, val)}
                        onCommentClick={() => openComment(pi, di)}
                      />
                    </td>
                  ))}
                  <td className="week-grid__total-cell">{rowTotal || ''}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="week-grid__summary">
              <td>
                <span>Totalt</span>
                {/* Mobile: day totals grid */}
                <div className="week-grid__mobile-summary">
                  {days.map((d, di) => (
                    <span key={`label-${di}`} className={`week-grid__mobile-day-label ${isToday(d) ? 'week-grid__mobile-day-label--today' : ''}`}>
                      {SHORT_DAY[di]}
                    </span>
                  ))}
                  {dayTotals.map((t, i) => (
                    <span key={`total-${i}`} className="week-grid__mobile-day-total">
                      {t || ''}
                    </span>
                  ))}
                  <span className="week-grid__mobile-grand-label">&Sigma;</span>
                  <span className="week-grid__mobile-grand-total">{grandTotal || ''}</span>
                </div>
              </td>
              {dayTotals.map((t, i) => (
                <td key={i}>{t || ''}</td>
              ))}
              <td>{grandTotal || ''}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <CommentDialog
        open={commentTarget !== null}
        dayLabel={commentTarget?.dayLabel ?? ''}
        internalNote={commentTarget?.internal ?? ''}
        externalNote={commentTarget?.external ?? ''}
        onSave={(internal, external) => {
          if (commentTarget) {
            onCommentChange(commentTarget.projectIdx, commentTarget.dayIdx, internal, external);
          }
          setCommentTarget(null);
        }}
        onClose={() => setCommentTarget(null)}
      />
    </>
  );
}
