import { useId, useState, type ChangeEvent } from 'react';
import { catalogue, e8Requirements } from '../data/index.ts';
import { MAX_IMPORT_BYTES, answersToCsv, buildExport, parseImport } from '../lib/importExport.ts';
import { useAssessment } from '../state/assessmentContext.ts';
import { downloadText, localDateStamp } from './download.ts';

type Message = { kind: 'success' | 'error'; text: string; details?: string[] } | null;

const STATUS_TEXT = {
  off: 'Saving is off. Your answers are kept only until you close or refresh this page.',
  saved: 'Saved on this device.',
  failed: 'Could not save: your browser is blocking storage. Export your answers to keep them.',
} as const;

/** Save, clear, import and export controls. All data stays on the user's device. */
export function DataControls() {
  const { state, replace, savingEnabled, saveStatus, setSaving, clearAll } = useAssessment();
  const [message, setMessage] = useState<Message>(null);
  const id = useId();

  function exportJson() {
    const now = new Date();
    downloadText(
      `eight-to-essentials-answers-${localDateStamp(now)}.json`,
      JSON.stringify(buildExport(state, now), null, 2),
      'application/json',
    );
  }

  function exportCsv() {
    downloadText(
      `eight-to-essentials-answers-${localDateStamp(new Date())}.csv`,
      answersToCsv(state, e8Requirements),
      'text/csv;charset=utf-8',
    );
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = ''; // Lets the same file be chosen again after fixing it.
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ kind: 'error', text: 'Import failed: the file is larger than 1 MB.' });
      return;
    }
    const result = parseImport(await file.text(), file.size, catalogue);
    if (!result.ok) {
      setMessage({
        kind: 'error',
        text: 'Import failed: this is not a valid Eight to Essentials answers file.',
        details: result.errors,
      });
      return;
    }
    const hasAnswers = Object.keys(state.answers).length > 0;
    if (hasAnswers && !window.confirm('Replace your current answers with the imported file?')) {
      return;
    }
    replace(result.state);
    setMessage({
      kind: 'success',
      text: `Imported ${Object.keys(result.state.answers).length} answers.`,
    });
  }

  function clear() {
    if (window.confirm('Clear all answers and any data saved on this device?')) {
      clearAll();
      setMessage({ kind: 'success', text: 'Your data has been cleared.' });
    }
  }

  return (
    <section className="panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="panel__title">
        Your data
      </h2>
      <p className="muted">Everything stays in your browser. Nothing is sent anywhere.</p>
      <label className="option">
        <input
          type="checkbox"
          checked={savingEnabled}
          onChange={(e) => setSaving(e.target.checked)}
        />
        <span>Save my progress on this device</span>
      </label>
      <p className="save-status" role="status">
        {STATUS_TEXT[saveStatus]}
      </p>
      <div className="button-row">
        <button type="button" className="button button--secondary" onClick={exportJson}>
          Export answers (JSON)
        </button>
        <button type="button" className="button button--secondary" onClick={exportCsv}>
          Export answers (CSV)
        </button>
        <label className="button button--secondary file-button">
          Import answers (JSON)
          <input
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={importFile}
          />
        </label>
        <button type="button" className="button button--danger" onClick={clear}>
          Clear my data
        </button>
      </div>
      {message && (
        <div
          className={`message message--${message.kind}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          <p>{message.text}</p>
          {message.details && (
            <ul>
              {message.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
