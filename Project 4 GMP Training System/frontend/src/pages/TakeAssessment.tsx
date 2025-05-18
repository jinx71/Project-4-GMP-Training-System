import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Assessment, ApiResponse } from '../types';
import Stamp from '../components/Stamp';

export default function TakeAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<Assessment>>(`/assessments/${id}`).then((r) => {
      setAssessment(r.data.data);
      setAnswers(new Array(r.data.data.questions.length).fill(-1));
    });
  }, [id]);

  if (!assessment) return <p className="text-sm text-slate-500">Loading assessment…</p>;

  const submit = async () => {
    if (answers.includes(-1) && !confirm('Some questions are unanswered. Submit anyway?')) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/assessments/${id}/attempts`, { answers });
      alert('Assessment submitted for evaluation.');
      navigate('/my-trainings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">{assessment.title}</h1>
        <p className="text-sm text-slate-500">
          {assessment.training.code} — {assessment.training.title} · Pass mark {assessment.passMarkPct}%
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Window: <Stamp iso={assessment.scheduledFrom} /> → <Stamp iso={assessment.scheduledTo} />
        </p>
      </div>
      {assessment.questions.map((q, qi) => (
        <div key={q.id} className="card">
          <p className="font-medium text-sm mb-3">Q{qi + 1}. {q.text} <span className="text-slate-400">({q.marks} mark{q.marks > 1 ? 's' : ''})</span></p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label key={oi} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-failed">{error}</p>}
      <button className="btn-primary" onClick={submit} disabled={busy}>
        {busy ? 'Submitting…' : 'Submit assessment'}
      </button>
    </div>
  );
}
