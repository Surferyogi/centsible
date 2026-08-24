import React, { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Trends from './components/Trends.jsx';
import Checks from './components/Checks.jsx';
import Import from './components/Import.jsx';
import History from './components/History.jsx';
import YearEnd from './components/YearEnd.jsx';
import Settings from './components/Settings.jsx';
import {
  loadPayslips, savePayslips, loadSettings, saveSettings,
  upsert, removeRecord, resetAll, sortByPeriod,
} from './lib/storage.js';

// Version stamp — format vYYYY:MMM:DD-HH:MM.
// Update this on every change to App.jsx.
export const APP_VERSION = 'v2026:AUG:25-07:15';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'trends',    label: 'Trends' },
  { id: 'checks',    label: 'Checks' },
  { id: 'yearend',   label: 'Year-end' },
  { id: 'import',    label: 'Add document' },
  { id: 'history',   label: 'History' },
  { id: 'settings',  label: 'Settings' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [payslips, setPayslips] = useState([]);
  const [settings, setSettings] = useState(loadSettings());

  useEffect(() => { setPayslips(loadPayslips()); }, []);

  function commit(list) {
    const sorted = sortByPeriod(list);
    setPayslips(sorted);
    savePayslips(sorted);
  }

  const handlers = useMemo(() => ({
    save: (record) => commit(upsert(payslips, record).list),
    saveMany: (records) => {
      let list = payslips;
      for (const r of records) list = upsert(list, r).list;
      commit(list);
    },
    remove: (key) => commit(removeRecord(payslips, key)),
    replaceAll: (list) => commit(list),
    reset: () => { resetAll(); setPayslips([]); },
    updateSettings: (s) => { setSettings(s); saveSettings(s); },
  }), [payslips]);

  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <div className="wordmark">
            <span className="kanji" aria-hidden="true">¥</span>
            <div>
              <h1>Centsible</h1>
              <div className="tag">給与明細書 · Payslip monitor</div>
            </div>
          </div>
          <div className="build">{APP_VERSION}</div>
        </div>
        <nav className="tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" className="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page">
        {tab === 'dashboard' && <Dashboard payslips={payslips} settings={settings} onOpenTab={setTab} />}
        {tab === 'trends'    && <Trends payslips={payslips} />}
        {tab === 'checks'    && <Checks payslips={payslips} />}
        {tab === 'yearend'   && <YearEnd payslips={payslips} />}
        {tab === 'import'    && <Import payslips={payslips} onSave={handlers.save} onSaveMany={handlers.saveMany} />}
        {tab === 'history'   && <History payslips={payslips} onDelete={handlers.remove} />}
        {tab === 'settings'  && (
          <Settings payslips={payslips} settings={settings} version={APP_VERSION}
                    onSettings={handlers.updateSettings}
                    onReplaceAll={handlers.replaceAll}
                    onReset={handlers.reset} />
        )}
      </main>
    </>
  );
}
