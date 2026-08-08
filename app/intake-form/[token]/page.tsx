'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react';
import { supportConfig } from '@/lib/config';

type FieldType = 'Text' | 'Textarea' | 'YesNo' | 'MultipleChoice' | 'Checkboxes' | 'Date';
type FormType = 'Anamnese' | 'Einverstaendnis' | 'Fragebogen' | 'Nachsorge';

const FORM_TYPE_LABEL: Record<FormType, string> = {
  Anamnese: 'Anamnese',
  Einverstaendnis: 'Einverständnis',
  Fragebogen: 'Kundenfragebogen',
  Nachsorge: 'Nachsorge',
};
const FORM_TYPE_ORDER: FormType[] = ['Anamnese', 'Einverstaendnis', 'Fragebogen', 'Nachsorge'];

interface FormField {
  id: string;
  label: string;
  fieldType: FieldType;
  formType: FormType;
  optionsJson: string | null;
  isRequired: boolean;
  conditionalOnFieldId: string | null;
  conditionalOnValue: string | null;
}

interface FormPreview {
  alreadySubmitted: boolean;
  tenantName: string;
  fields: FormField[];
}

type State = 'loading' | 'form' | 'submitting' | 'submitted' | 'already_submitted' | 'error';

const PRIMARY = '#ECEBF2';

export default function IntakeFormPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [preview, setPreview] = useState<FormPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/public/intake-form/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.message ?? 'Ungültiger Link.');
          setState('error');
          return;
        }
        setPreview(data);
        setState(data.alreadySubmitted ? 'already_submitted' : 'form');
      })
      .catch(() => {
        setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
        setState('error');
      });
  }, [token, apiBase]);

  const setAnswer = (fieldId: string, value: string) => setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const toggleChecklistOption = (fieldId: string, option: string) => {
    const current = (answers[fieldId] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    setAnswer(fieldId, next.join(', '));
  };

  const isFieldVisible = (field: FormField) =>
    !field.conditionalOnFieldId || answers[field.conditionalOnFieldId] === field.conditionalOnValue;

  const visibleFields = preview?.fields.filter(isFieldVisible) ?? [];
  const canSubmit = visibleFields.every((f) => !f.isRequired || (answers[f.id] ?? '').trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setState('submitting');
    try {
      const res = await fetch(`${apiBase}/public/intake-form/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: visibleFields.map((f) => ({ fieldId: f.id, value: answers[f.id] ?? '' })) }),
      });
      if (res.ok) {
        setState('submitted');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.message ?? 'Übermittlung fehlgeschlagen. Bitte versuche es erneut.');
        setState('error');
      }
    } catch {
      setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
      setState('error');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F6F5FA] to-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${PRIMARY} transparent ${PRIMARY} ${PRIMARY}` }} />
      </div>
    );
  }

  const fieldsByFormType = FORM_TYPE_ORDER
    .map((type) => ({ type, fields: visibleFields.filter((f) => f.formType === type) }))
    .filter((group) => group.fields.length > 0);
  const showSectionHeaders = fieldsByFormType.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6F5FA] to-white flex items-center justify-center p-5">
      <AnimatePresence mode="wait">

        {state === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#14162B] mb-2">Ungültiger Link</h1>
            <p className="text-[#8A8A8A] mb-6 text-sm">{errorMessage}</p>
            <a href={supportConfig.mailto('Problem mit Formular-Link')}
              className="inline-block bg-[#14162B] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#333] transition-colors">
              Support kontaktieren
            </a>
          </motion.div>
        )}

        {state === 'already_submitted' && (
          <motion.div key="already"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-[#14162B] mb-2">Bereits ausgefüllt</h1>
            <p className="text-[#8A8A8A] text-sm">Du hast dieses Formular für diesen Termin bereits übermittelt.</p>
          </motion.div>
        )}

        {state === 'submitted' && (
          <motion.div key="submitted"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg, #6bcb84, #4caf67)' }}>
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/40">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Vielen Dank!</h1>
            </div>
            <div className="p-6 text-center">
              <p className="text-[#8A8A8A] text-sm">Dein Formular wurde erfolgreich übermittelt.</p>
            </div>
          </motion.div>
        )}

        {(state === 'form' || state === 'submitting') && preview && (
          <motion.div key="form"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #D8D7E2)` }}>
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/40">
                <ClipboardList size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Formular</h1>
              <p className="text-white/65 text-sm mt-1">{preview.tenantName}</p>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {fieldsByFormType.map((group) => (
                <div key={group.type} className="space-y-4">
                  {showSectionHeaders && (
                    <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-widest">{FORM_TYPE_LABEL[group.type]}</p>
                  )}
                  {group.fields.map((field) => {
                    const options: string[] = (field.fieldType === 'MultipleChoice' || field.fieldType === 'Checkboxes') && field.optionsJson
                      ? JSON.parse(field.optionsJson) : [];
                    const selectedOptions = (answers[field.id] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
                    return (
                      <div key={field.id}>
                        <label className="text-sm font-semibold text-[#14162B] mb-1.5 block">
                          {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                        </label>
                        {field.fieldType === 'Text' && (
                          <input
                            type="text"
                            value={answers[field.id] ?? ''}
                            onChange={(e) => setAnswer(field.id, e.target.value)}
                            className="w-full bg-[#F6F5FA] rounded-xl p-3 text-sm text-[#14162B] outline-none focus:ring-2 focus:ring-[#D8D7E2]"
                          />
                        )}
                        {field.fieldType === 'Textarea' && (
                          <textarea
                            value={answers[field.id] ?? ''}
                            onChange={(e) => setAnswer(field.id, e.target.value)}
                            rows={3}
                            className="w-full bg-[#F6F5FA] rounded-xl p-3 text-sm text-[#14162B] outline-none focus:ring-2 focus:ring-[#D8D7E2] resize-none"
                          />
                        )}
                        {field.fieldType === 'Date' && (
                          <input
                            type="date"
                            value={answers[field.id] ?? ''}
                            onChange={(e) => setAnswer(field.id, e.target.value)}
                            className="w-full bg-[#F6F5FA] rounded-xl p-3 text-sm text-[#14162B] outline-none focus:ring-2 focus:ring-[#D8D7E2]"
                          />
                        )}
                        {field.fieldType === 'YesNo' && (
                          <div className="flex gap-2">
                            {['Ja', 'Nein'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswer(field.id, opt)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                  answers[field.id] === opt ? 'bg-[#14162B] text-white' : 'bg-[#F6F5FA] text-[#14162B]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {field.fieldType === 'MultipleChoice' && (
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswer(field.id, opt)}
                                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                  answers[field.id] === opt ? 'bg-[#14162B] text-white' : 'bg-[#F6F5FA] text-[#14162B]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {field.fieldType === 'Checkboxes' && (
                          <div className="flex flex-wrap gap-2">
                            {options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleChecklistOption(field.id, opt)}
                                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                  selectedOptions.includes(opt) ? 'bg-[#14162B] text-white' : 'bg-[#F6F5FA] text-[#14162B]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-6 pt-0">
              <motion.button
                onClick={handleSubmit}
                disabled={!canSubmit || state === 'submitting'}
                whileHover={{ scale: canSubmit && state !== 'submitting' ? 1.01 : 1 }}
                whileTap={{ scale: canSubmit && state !== 'submitting' ? 0.97 : 1 }}
                className="w-full flex items-center justify-center gap-2 bg-[#14162B] text-white px-6 py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#333] transition-colors disabled:opacity-40"
              >
                {state === 'submitting' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Wird gesendet…
                  </>
                ) : (
                  'Formular absenden'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
