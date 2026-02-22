import { useState, useEffect, useCallback } from 'react';
import { Login } from './components/Login/Login';
import { WeekGrid } from './components/WeekGrid/WeekGrid';
import { WeekNav } from './components/WeekNav/WeekNav';
import { Button } from './components/Button/Button';
import { useAuth } from './hooks/useAuth';
import { useTimeReport } from './hooks/useTimeReport';
import { getWeekDates, formatWeekLabel } from './utils/date';

/** Read weekOffset from URL search param `?week=` */
function getInitialWeekOffset(): number {
  const params = new URLSearchParams(window.location.search);
  const w = params.get('week');
  if (w !== null) {
    const n = parseInt(w, 10);
    if (!isNaN(n)) return n;
  }
  return 0;
}

/** Sync weekOffset to URL without full page reload */
function syncWeekToUrl(offset: number) {
  const url = new URL(window.location.href);
  if (offset === 0) {
    url.searchParams.delete('week');
  } else {
    url.searchParams.set('week', String(offset));
  }
  window.history.replaceState(null, '', url.toString());
}

export function App() {
  const {
    jwt, employee, companyId, companyName, companies,
    login, cancelLogin, logout, isLoggingIn, loginStatus, bankIdQr, switchCompany,
  } = useAuth();
  const [weekOffset, setWeekOffset] = useState(getInitialWeekOffset);

  // Sync week offset to URL
  useEffect(() => {
    syncWeekToUrl(weekOffset);
  }, [weekOffset]);

  const { monday, sunday } = getWeekDates(weekOffset);
  const {
    projects,
    loading,
    saving,
    dirty,
    weekLocked,
    updateHours,
    updateComment,
    save,
    toggleLock,
    reset,
  } = useTimeReport(jwt, companyId, employee?.id ?? null, employee?.name ?? '', monday, sunday);

  // Global keyboard shortcuts
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    const inDialog = (e.target as HTMLElement).closest('[role="dialog"]');
    if (inDialog) return;

    // Ctrl/Cmd+Enter = save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (dirty && !saving && !weekLocked) save();
      return;
    }

    // Escape = discard unsaved changes
    if (e.key === 'Escape') {
      if (dirty) {
        e.preventDefault();
        reset();
      }
      return;
    }

    const inNumberInput = tag === 'INPUT' && (e.target as HTMLInputElement).type === 'number';
    const inTextInput = tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && (e.target as HTMLInputElement).type === 'text');

    // Arrow keys: navigate weeks (plain when unfocused, Alt+Arrow when in input)
    if (!inTextInput && !e.ctrlKey && !e.metaKey) {
      const arrowOk = !inNumberInput || e.altKey;
      if (arrowOk && e.key === 'ArrowLeft') {
        e.preventDefault();
        setWeekOffset(o => o - 1);
        return;
      }
      if (arrowOk && e.key === 'ArrowRight') {
        e.preventDefault();
        setWeekOffset(o => o + 1);
        return;
      }
    }

    // t = today, l = lock — safe in number inputs (letters can't be typed)
    if (!inTextInput) {
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setWeekOffset(0);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (!saving) toggleLock();
      }
    }
  }, [dirty, saving, weekLocked, save, toggleLock, reset]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [handleGlobalKey]);

  if (!jwt) {
    return <Login onLogin={login} onCancel={cancelLogin} isLoggingIn={isLoggingIn} status={loginStatus} bankIdQr={bankIdQr} />;
  }

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = companies.find((c) => String(c.Id) === e.target.value);
    if (selected) switchCompany(selected);
  };

  return (
    <div className="app">
      <header className="app-header halftone">
        <div className="app-header__inner">
          <h1 className="app-header__title">Tidrapporting</h1>
          <div className="app-header__right">
            <div className="app-header__user">
              <span className="app-header__name">{employee?.name}</span>
              {companies.length > 1 ? (
                <select
                  value={companyId ?? ''}
                  onChange={handleCompanyChange}
                  className="company-select"
                >
                  {companies.map((c) => (
                    <option key={c.Id} value={String(c.Id)}>{c.Name}</option>
                  ))}
                </select>
              ) : (
                companyName && <span className="app-header__company">{companyName}</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>Logga ut</Button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <WeekNav
          label={formatWeekLabel(monday)}
          onPrev={() => setWeekOffset(o => o - 1)}
          onNext={() => setWeekOffset(o => o + 1)}
          onToday={() => setWeekOffset(0)}
        />
        <WeekGrid
          monday={monday}
          projects={projects}
          loading={loading}
          onHoursChange={updateHours}
          onCommentChange={updateComment}
        />
      </main>

      {/* Sticky bottom action bar */}
      <div className="app-actions">
        <div className="app-actions__inner">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLock}
            disabled={saving}
          >
            {weekLocked ? 'Lås upp' : 'Lås vecka'}
          </Button>
          <div className="app-actions__right">
            {dirty && <span className="app-actions__dirty">Osparade ändringar</span>}
            <Button
              variant="primary"
              onClick={save}
              disabled={!dirty || saving || weekLocked}
            >
              {saving ? 'Sparar...' : 'Spara'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
