// app/admin/intake-form/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, AlertTriangle, Plus, Trash2, ArrowUp, ArrowDown, Loader2, Sparkles, Ban } from "lucide-react";
import { adminApi, type IntakeFormField, type IntakeFormFieldType, type IntakeFormType } from "@/lib/api/admin";
import { getAdminCategories, type AdminServiceCategory } from "@/lib/api/admin-services";

const FIELD_TYPE_LABEL: Record<IntakeFormFieldType, string> = {
  Text: "Kurztext",
  Textarea: "Langtext",
  YesNo: "Ja/Nein",
  MultipleChoice: "Einfachauswahl",
  Checkboxes: "Mehrfachauswahl",
  Date: "Datum",
};

const FORM_TYPE_LABEL: Record<IntakeFormType, string> = {
  Anamnese: "Anamnese",
  Einverstaendnis: "Einverständnis",
  Fragebogen: "Kundenfragebogen",
  Nachsorge: "Nachsorge",
};
const FORM_TYPE_ORDER: IntakeFormType[] = ["Anamnese", "Einverstaendnis", "Fragebogen", "Nachsorge"];

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

export default function AdminIntakeFormPage() {
  const [fields, setFields] = useState<IntakeFormField[] | null>(null);
  const [categories, setCategories] = useState<AdminServiceCategory[]>([]);
  const [templates, setTemplates] = useState<{ key: string; label: string; fieldCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [industryBlocked, setIndustryBlocked] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<IntakeFormFieldType>("Text");
  const [newFormType, setNewFormType] = useState<IntakeFormType>("Anamnese");
  const [newOptions, setNewOptions] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [newRequired, setNewRequired] = useState(false);
  const [newConditionalOnFieldId, setNewConditionalOnFieldId] = useState<string>("");
  const [newConditionalOnValue, setNewConditionalOnValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [templateCategoryId, setTemplateCategoryId] = useState<string>("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null); setNeedsUpgrade(false); setIndustryBlocked(null);
      const [fieldsData, categoriesData] = await Promise.all([
        adminApi.getIntakeFormFields(),
        getAdminCategories().catch(() => []),
      ]);
      setFields(fieldsData);
      setCategories(categoriesData);
      adminApi.getIntakeFormTemplates().then(setTemplates).catch(() => {});
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.feature) {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else if (err.response?.status === 403 && err.response?.data?.feature === "intake_form_industry") {
        setIndustryBlocked(err.response.data.message);
      } else {
        setError(err.response?.data?.message || err.message || "Fehler beim Laden der Formulare");
      }
    } finally { setLoading(false); }
  }

  function resetNewFieldForm() {
    setNewLabel(""); setNewOptions(""); setNewRequired(false); setNewType("Text");
    setNewFormType("Anamnese"); setNewCategoryId(""); setNewConditionalOnFieldId(""); setNewConditionalOnValue("");
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await adminApi.createIntakeFormField({
        label: newLabel.trim(),
        fieldType: newType,
        formType: newFormType,
        optionsJson: newType === "MultipleChoice" || newType === "Checkboxes"
          ? JSON.stringify(newOptions.split(",").map((s) => s.trim()).filter(Boolean))
          : null,
        categoryId: newCategoryId || null,
        conditionalOnFieldId: newConditionalOnFieldId || null,
        conditionalOnValue: newConditionalOnFieldId ? newConditionalOnValue : null,
        isRequired: newRequired,
      });
      resetNewFieldForm();
      await load();
    } catch {
      // keep form filled so the admin can retry
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(field: IntakeFormField) {
    setBusyId(field.id);
    try {
      await adminApi.updateIntakeFormField(field.id, {
        label: field.label, fieldType: field.fieldType, formType: field.formType, optionsJson: field.optionsJson,
        categoryId: field.categoryId, conditionalOnFieldId: field.conditionalOnFieldId, conditionalOnValue: field.conditionalOnValue,
        isRequired: field.isRequired, isActive: !field.isActive,
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(field: IntakeFormField) {
    if (!confirm(`Feld „${field.label}“ wirklich löschen?`)) return;
    setBusyId(field.id);
    try {
      await adminApi.deleteIntakeFormField(field.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(field: IntakeFormField, direction: -1 | 1) {
    if (!fields) return;
    const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((f) => f.id === field.id);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    [sorted[idx], sorted[swapWith]] = [sorted[swapWith], sorted[idx]];
    setBusyId(field.id);
    try {
      await adminApi.reorderIntakeFormFields(sorted.map((f) => f.id));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleApplyTemplate(key: string) {
    setApplyingTemplate(key);
    try {
      await adminApi.applyIntakeFormTemplate(key, templateCategoryId || null);
      setShowTemplates(false);
      await load();
    } finally {
      setApplyingTemplate(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#EEEBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={20} className="text-[#6355E4]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">Formulare</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-[#9CA3AF] mb-3">
              Dein aktueller Tarif: <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? "Formulare sind in deinem aktuellen Tarif nicht enthalten."}
          </p>
          <a href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors">
            <TrendingUp size={15} /> Jetzt upgraden
          </a>
        </div>
      </div>
    );
  }

  if (industryBlocked) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ban size={20} className="text-[#9CA3AF]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">Formulare</h2>
          <p className="text-sm text-[#6B7280]">{industryBlocked}</p>
        </div>
      </div>
    );
  }

  if (error || !fields) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-sm">
          <div className="w-11 h-11 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={18} className="text-[#991B1B]" />
          </div>
          <p className="font-semibold text-[#111318] mb-1">Fehler beim Laden</p>
          <p className="text-sm text-[#6B7280]">{error || "Unbekannter Fehler"}</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  const fieldsByFormType = FORM_TYPE_ORDER.map((type) => ({
    type,
    fields: sortedFields.filter((f) => f.formType === type),
  })).filter((group) => group.fields.length > 0);

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">Formulare</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Erstelle individuelle Fragebögen und Anamneseformulare, die deine Kund:innen vor ihrem Termin ausfüllen können. Felder ohne Kategorie gelten für alle Leistungen.
            </p>
          </div>
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] px-3.5 py-2 text-xs font-semibold text-[#6355E4] hover:bg-[#EEEBFC]"
            >
              <Sparkles size={13} /> Vorlage verwenden
            </button>
          )}
        </div>

        {showTemplates && (
          <div className="bg-white rounded-2xl border border-[#C7D2FE] shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-[#111318]">Vorlage anwenden</p>
            <p className="text-xs text-[#9CA3AF]">Die Felder werden übernommen und können danach frei bearbeitet oder gelöscht werden.</p>
            {categories.length > 0 && (
              <select value={templateCategoryId} onChange={(e) => setTemplateCategoryId(e.target.value)} className={inputCls}>
                <option value="">Für alle Kategorien</option>
                {categories.map((c) => <option key={c.id} value={c.id}>Nur für: {c.name}</option>)}
              </select>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleApplyTemplate(t.key)}
                  disabled={applyingTemplate !== null}
                  className="text-left rounded-xl border border-[#E5E7EB] p-3 hover:border-[#A5B4FC] hover:bg-[#F8F7FF] disabled:opacity-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-[#111318]">{t.label}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{t.fieldCount} Felder</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {sortedFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={20} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">Noch keine Felder</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Füge unten dein erstes Feld hinzu, oder starte mit einer Vorlage.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {fieldsByFormType.map((group) => (
                <div key={group.type}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest">{FORM_TYPE_LABEL[group.type]}</p>
                  {group.fields.map((field) => {
                    const idx = sortedFields.indexOf(field);
                    return (
                      <div key={field.id} className="p-4 flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleMove(field, -1)} disabled={idx === 0 || busyId === field.id}
                            className="text-[#9CA3AF] hover:text-[#6355E4] disabled:opacity-30">
                            <ArrowUp size={13} />
                          </button>
                          <button onClick={() => handleMove(field, 1)} disabled={idx === sortedFields.length - 1 || busyId === field.id}
                            className="text-[#9CA3AF] hover:text-[#6355E4] disabled:opacity-30">
                            <ArrowDown size={13} />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#111318] truncate">
                            {field.label} {field.isRequired && <span className="text-[#991B1B]">*</span>}
                          </p>
                          <p className="text-[11px] text-[#9CA3AF]">
                            {FIELD_TYPE_LABEL[field.fieldType]}
                            {field.categoryId && (
                              <> · nur {categories.find((c) => c.id === field.categoryId)?.name ?? "Kategorie"}</>
                            )}
                            {field.conditionalOnFieldId && (
                              <> · nur wenn „{fields?.find((f) => f.id === field.conditionalOnFieldId)?.label}“ = „{field.conditionalOnValue}“</>
                            )}
                            {(field.fieldType === "MultipleChoice" || field.fieldType === "Checkboxes") && field.optionsJson && (
                              <> · {(JSON.parse(field.optionsJson) as string[]).join(", ")}</>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(field)}
                          disabled={busyId === field.id}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                            field.isActive ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                        >
                          {field.isActive ? "Aktiv" : "Inaktiv"}
                        </button>
                        <button
                          onClick={() => handleDelete(field)}
                          disabled={busyId === field.id}
                          className="text-[#9CA3AF] hover:text-[#991B1B] disabled:opacity-50"
                        >
                          {busyId === field.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-[#111318]">Neues Feld</p>
          <input
            type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder="z. B. Bekannte Allergien" className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <select value={newType} onChange={(e) => setNewType(e.target.value as IntakeFormFieldType)} className={inputCls}>
              {Object.entries(FIELD_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={newFormType} onChange={(e) => setNewFormType(e.target.value as IntakeFormType)} className={inputCls}>
              {FORM_TYPE_ORDER.map((type) => <option key={type} value={type}>{FORM_TYPE_LABEL[type]}</option>)}
            </select>
          </div>

          {(newType === "MultipleChoice" || newType === "Checkboxes") && (
            <input
              type="text" value={newOptions} onChange={(e) => setNewOptions(e.target.value)}
              placeholder="Optionen, mit Komma getrennt" className={inputCls}
            />
          )}

          {categories.length > 0 && (
            <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className={inputCls}>
              <option value="">Gilt für alle Kategorien</option>
              {categories.map((c) => <option key={c.id} value={c.id}>Nur für: {c.name}</option>)}
            </select>
          )}

          {sortedFields.length > 0 && (
            <div className="flex gap-2">
              <select value={newConditionalOnFieldId} onChange={(e) => setNewConditionalOnFieldId(e.target.value)} className={inputCls}>
                <option value="">Immer anzeigen</option>
                {sortedFields.map((f) => <option key={f.id} value={f.id}>Nur wenn „{f.label}“ =</option>)}
              </select>
              {newConditionalOnFieldId && (
                <input
                  type="text" value={newConditionalOnValue} onChange={(e) => setNewConditionalOnValue(e.target.value)}
                  placeholder="Wert, z. B. Ja" className={inputCls}
                />
              )}
            </div>
          )}

          <label className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} />
            Pflichtfeld
          </label>

          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Feld hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
