import { FormEvent, useEffect, useState } from 'react';
import api from '../../api';
import { Training, ApiResponse } from '../../types';

interface QDraft { text: string; options: string[]; correctIndex: number; marks: number; }

const emptyQ = (): QDraft => ({ text: '', options: ['', '', '', ''], correctIndex: 0, marks: 1 });

export default function SetAssessments() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [trainingId, setTrainingId] = useState('');
  const [title, setTitle] = useState('');
  const [passMarkPct, setPassMarkPct] = useState(80);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [questions, setQuestions] = useState<QDraft[]>([emptyQ()]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<Training[]>>('/trainings').then((r) => setTrainings(r.data.data));
  }, []);

  const updateQ = (i: number, patch: Partial<QDraft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api.post('/assessments', {
        trainingId, title, passMarkPct,
        scheduledFrom: new Date(from).toISOString(),
        scheduledTo: new Date(to).toISOString(),
        questions
      });
      setMsg('Assessment created and scheduled.');
      setTitle(''); setQuestions([emptyQ()]);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Set assessment</h1>
      <div className="card grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Training</label>
          <select className="field" value={trainingId} onChange={(e) => setTrainingId(e.target.value)} required>
            <option value="">Select training…</option>
            {trainings.map((t) => <option key={t.id} value={t.id}>{t.code} — {t.title}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Assessment title</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Scheduled from</label>
          <input className="field" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Scheduled to</label>
          <input className="field" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Pass mark (%)</label>
          <input className="field" type="number" min={1} max={100} value={passMarkPct} onChange={(e) => setPassMarkPct(Number(e.target.value))} required />
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Question {i + 1}</p>
            {questions.length > 1 && (
              <button type="button" className="text-xs text-failed underline" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}>
                Remove
              </button>
            )}
          </div>
          <input className="field" placeholder="Question text" value={q.text} onChange={(e) => updateQ(i, { text: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  title="Correct answer"
                  name={`correct-${i}`}
                  checked={q.correctIndex === oi}
                  onChange={() => updateQ(i, { correctIndex: oi })}
                />
                <input
                  className="field"
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => updateQ(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })}
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Marks</label>
            <input className="field w-24" type="number" min={1} value={q.marks} onChange={(e) => updateQ(i, { marks: Number(e.target.value) })} />
            <span className="text-xs text-slate-400">Radio button marks the correct option.</span>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button type="button" className="btn-ghost" onClick={() => setQuestions((qs) => [...qs, emptyQ()])}>Add question</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Create assessment'}</button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
