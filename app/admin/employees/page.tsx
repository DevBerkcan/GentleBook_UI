"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { Chip } from "@nextui-org/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import {
  Plus, Edit, Trash2, Users, AlertCircle, X, Save, UserCheck, UserX,
  Lock, Eye, EyeOff, Key, MapPin, Clock
} from "lucide-react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee, type CreateEmployeeDto } from "@/lib/api/employees";
import api from "@/lib/api/client";
import { useConfirm } from "@/components/ConfirmDialog";

const MODAL_CLS = {
  base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
  header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
  footer: "border-t border-[#E8C7C3]/20 bg-[#F5EDEB]/30",
  body: "py-5",
};
const INPUT_CLS = {
  inputWrapper: "bg-[#F5EDEB] border border-[#E8C7C3]/40 hover:border-[#017172] data-[focus=true]:border-[#017172]",
  label: "text-[#8A8A8A] font-medium",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-[#017172]", "bg-[#C09995]", "bg-[#D8B0AC]", "bg-[#6b7280]",
  "bg-emerald-600", "bg-amber-600", "bg-violet-600",
];
const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const DAYS = [
  { value: 1, label: 'Mo' }, { value: 2, label: 'Di' }, { value: 3, label: 'Mi' },
  { value: 4, label: 'Do' }, { value: 5, label: 'Fr' }, { value: 6, label: 'Sa' },
  { value: 0, label: 'So' },
];

interface ScheduleItem { dayOfWeek: number; isWorkingDay: boolean; startTime: string; endTime: string; }

const defaultSchedule = (): ScheduleItem[] =>
  DAYS.map((d) => ({ dayOfWeek: d.value, isWorkingDay: d.value >= 1 && d.value <= 5, startTime: '09:00', endTime: '18:00' }));

const EMPTY: CreateEmployeeDto = {
  name: "",
  role: "",
  specialty: "",
  username: "",
  password: "",
  location: ""  // Added location
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateEmployeeDto>(EMPTY);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState("");
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState<Employee | null>(null);
  const { isOpen: isToggleModalOpen, onOpen: onToggleModalOpen, onClose: onToggleModalClose } = useDisclosure();
  const [toggling, setToggling] = useState(false);
  const [selectedEmployeeForToggle, setSelectedEmployeeForToggle] = useState<Employee | null>(null);

  // Schedule modal
  const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onClose: onScheduleClose } = useDisclosure();
  const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(defaultSchedule());
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const { confirm, dialog } = useConfirm();

  useEffect(() => { load(); }, [showInactive]);

  async function load() {
    setLoading(true); setError(null);
    try { setEmployees(await getEmployees(!showInactive)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormActive(true);
    setModalErr(null);
    setResetPassword(false);
    setShowPassword(false);
    onOpen();
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      name: emp.name,
      role: emp.role,
      specialty: emp.specialty ?? "",
      username: emp.username ?? "",
      location: emp.location ?? ""  // Added location
    });
    setFormActive(emp.isActive);
    setModalErr(null);
    setResetPassword(false);
    setShowNewPassword(false);
    onOpen();
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.role.trim()) {
      setModalErr("Name und Rolle sind Pflichtfelder");
      return;
    }

    // For new employees, username and password are required
    if (!editing && (!form.username?.trim() || !form.password?.trim())) {
      setModalErr("Benutzername und Passwort sind erforderlich");
      return;
    }

    // For editing with password reset, password is required
    if (editing && resetPassword && !form.password?.trim()) {
      setModalErr("Neues Passwort ist erforderlich");
      return;
    }

    setSubmitting(true);
    setModalErr(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        role: form.role.trim(),
        specialty: form.specialty?.trim() || null,
        location: form.location?.trim() || null  // Added location
      };

      // Add username for new employees or if changed
      if (form.username?.trim()) {
        payload.username = form.username.trim();
      }

      if (editing) {
        // For edit, include isActive
        payload.isActive = formActive;

        // Include new password only if reset is requested
        if (resetPassword && form.password?.trim()) {
          payload.newPassword = form.password.trim();
        }

        await updateEmployee(editing.id, payload);
      } else {
        // For new employees, include password
        if (form.password?.trim()) {
          payload.password = form.password.trim();
        }
        await createEmployee(payload);
      }

      await load();
      onClose();
    } catch (e: any) {
      setModalErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(emp: Employee) {
    setSelectedEmployeeForDelete(emp);
    onDeleteModalOpen();
  }

  async function handleDeleteConfirm() {
    if (!selectedEmployeeForDelete) return;

    setDeleting(true);
    try {
      await deleteEmployee(selectedEmployeeForDelete.id);
      await load();
      onDeleteModalClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
      setSelectedEmployeeForDelete(null);
    }
  }


  function handleToggle(emp: Employee) {
    setSelectedEmployeeForToggle(emp);
    onToggleModalOpen();
  }

  async function handleToggleConfirm() {
    if (!selectedEmployeeForToggle) return;

    setToggling(true);
    try {
      await updateEmployee(selectedEmployeeForToggle.id, {
        name: selectedEmployeeForToggle.name,
        role: selectedEmployeeForToggle.role,
        specialty: selectedEmployeeForToggle.specialty,
        isActive: !selectedEmployeeForToggle.isActive
      });
      await load();
      onToggleModalClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setToggling(false);
      setSelectedEmployeeForToggle(null);
    }
  }

  async function openSchedule(emp: Employee) {
    setScheduleEmployee(emp);
    setSchedule(defaultSchedule());
    setScheduleError('');
    setScheduleSaved(false);
    setScheduleLoading(true);
    onScheduleOpen();
    try {
      const res = await api.get(`/employees/${emp.id}/schedule`);
      const data: any[] = res.data?.data ?? [];
      if (data.length > 0) {
        setSchedule(DAYS.map((d) => {
          const found = data.find((s: any) => s.dayOfWeek === d.value);
          return found
            ? { dayOfWeek: d.value, isWorkingDay: found.isWorkingDay, startTime: found.startTime ?? '09:00', endTime: found.endTime ?? '18:00' }
            : { dayOfWeek: d.value, isWorkingDay: d.value >= 1 && d.value <= 5, startTime: '09:00', endTime: '18:00' };
        }));
      }
    } catch { /* use defaults */ }
    finally { setScheduleLoading(false); }
  }

  async function saveSchedule() {
    if (!scheduleEmployee) return;
    setScheduleSaving(true);
    setScheduleError('');
    try {
      await api.put(`/employees/${scheduleEmployee.id}/schedule`, schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        isWorkingDay: s.isWorkingDay,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '18:00',
      })));
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch (e: any) {
      setScheduleError(e.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setScheduleSaving(false);
    }
  }

  const updateScheduleItem = (dayOfWeek: number, field: keyof ScheduleItem, value: string | boolean) =>
    setSchedule((prev) => prev.map((s) => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s));

  const activeCount = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.length - activeCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">Mitarbeiter</h1>
            <p className="text-sm text-[#8A8A8A]">Fachkräfte verwalten und zuweisen</p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
            startContent={<Plus size={18} />}
            onPress={openCreate}
          >
            Mitarbeiter hinzufügen
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            onDeleteModalClose();
            setSelectedEmployeeForDelete(null);
          }}
          size="lg"
          placement="center"
          classNames={MODAL_CLS}
        >
          <ModalContent>
            {(onModalClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                      <AlertCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">Mitarbeiter löschen</h2>
                      <p className="text-xs text-[#8A8A8A]">
                        {selectedEmployeeForDelete?.name}
                      </p>
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {selectedEmployeeForDelete && (
                    <div className="space-y-4">
                      {/* Warning Message */}
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <p className="text-sm text-red-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            <strong>Achtung:</strong> Das Löschen eines Mitarbeiters ist endgültig und kann nicht rückgängig gemacht werden.
                          </span>
                        </p>
                      </div>

                      {/* Employee Info */}
                      <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(selectedEmployeeForDelete.name)}`}>
                            {initials(selectedEmployeeForDelete.name)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E1E1E]">{selectedEmployeeForDelete.name}</p>
                            <p className="text-sm text-[#8A8A8A]">{selectedEmployeeForDelete.role}</p>
                            {selectedEmployeeForDelete.location && (
                              <p className="text-xs text-[#8A8A8A] mt-1 flex items-center gap-1">
                                <MapPin size={10} /> {selectedEmployeeForDelete.location}
                              </p>
                            )}
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            className={selectedEmployeeForDelete.isActive ? "bg-[#017172]/10 text-[#017172]" : "bg-[#6b7280]/10 text-[#6b7280]"}
                          >
                            {selectedEmployeeForDelete.isActive ? "Aktiv" : "Inaktiv"}
                          </Chip>
                        </div>
                      </div>

                      {/* Impact Warning */}
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            <strong>Auswirkung:</strong> Beim Löschen eines Mitarbeiters werden alle zukünftigen Buchungen ungültig.
                            Bereits abgeschlossene Buchungen bleiben erhalten, können aber nicht mehr dem Mitarbeiter zugeordnet werden.
                          </span>
                        </p>
                      </div>

                      {/* Alternative Suggestion */}
                      <div className="bg-[#017172]/5 p-4 rounded-xl border border-[#017172]/20">
                        <p className="text-sm text-[#017172] flex items-start gap-2">
                          <UserX size={16} className="shrink-0 mt-0.5" />
                          <span>
                            <strong>Alternative:</strong> Statt zu löschen, können Sie den Mitarbeiter auch <strong>deaktivieren</strong>.
                            Deaktivierte Mitarbeiter erscheinen nicht in Buchungen, aber alle historischen Daten bleiben erhalten.
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={() => {
                      onModalClose();
                      setSelectedEmployeeForDelete(null);
                    }}
                    isDisabled={deleting}
                    startContent={<X size={14} />}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                    onPress={handleDeleteConfirm}
                    isLoading={deleting}
                    startContent={!deleting && <Trash2 size={14} />}
                  >
                    Endgültig löschen
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Toggle Active/Inactive Modal */}
        <Modal
          isOpen={isToggleModalOpen}
          onClose={() => {
            onToggleModalClose();
            setSelectedEmployeeForToggle(null);
          }}
          size="lg"
          placement="center"
          classNames={MODAL_CLS}
        >
          <ModalContent>
            {(onModalClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedEmployeeForToggle?.isActive
                        ? "bg-amber-500"
                        : "bg-[#017172]"
                      }`}>
                      {selectedEmployeeForToggle?.isActive
                        ? <UserX size={20} className="text-white" />
                        : <UserCheck size={20} className="text-white" />
                      }
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">
                        {selectedEmployeeForToggle?.isActive ? "Mitarbeiter deaktivieren" : "Mitarbeiter aktivieren"}
                      </h2>
                      <p className="text-xs text-[#8A8A8A]">
                        {selectedEmployeeForToggle?.name}
                      </p>
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {selectedEmployeeForToggle && (
                    <div className="space-y-4">
                      {/* Info Message */}
                      <div className={`p-4 rounded-xl border ${selectedEmployeeForToggle.isActive
                          ? "bg-amber-50 border-amber-200"
                          : "bg-[#017172]/5 border-[#017172]/20"
                        }`}>
                        <p className={`text-sm flex items-start gap-2 ${selectedEmployeeForToggle.isActive
                            ? "text-amber-700"
                            : "text-[#017172]"
                          }`}>
                          {selectedEmployeeForToggle.isActive
                            ? <UserX size={16} className="shrink-0 mt-0.5" />
                            : <UserCheck size={16} className="shrink-0 mt-0.5" />
                          }
                          <span>
                            <strong>
                              {selectedEmployeeForToggle.isActive
                                ? "Möchten Sie diesen Mitarbeiter wirklich deaktivieren?"
                                : "Möchten Sie diesen Mitarbeiter wirklich aktivieren?"}
                            </strong>
                            <br />
                            {selectedEmployeeForToggle.isActive
                              ? "Deaktivierte Mitarbeiter erscheinen nicht mehr in Buchungsformularen."
                              : "Aktivierte Mitarbeiter sind wieder für Buchungen verfügbar."}
                          </span>
                        </p>
                      </div>

                      {/* Employee Info */}
                      <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(selectedEmployeeForToggle.name)}`}>
                            {initials(selectedEmployeeForToggle.name)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E1E1E]">{selectedEmployeeForToggle.name}</p>
                            <p className="text-sm text-[#8A8A8A]">{selectedEmployeeForToggle.role}</p>
                            {selectedEmployeeForToggle.location && (
                              <p className="text-xs text-[#8A8A8A] mt-1 flex items-center gap-1">
                                <MapPin size={10} /> {selectedEmployeeForToggle.location}
                              </p>
                            )}
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            className={selectedEmployeeForToggle.isActive ? "bg-[#017172]/10 text-[#017172]" : "bg-[#6b7280]/10 text-[#6b7280]"}
                          >
                            {selectedEmployeeForToggle.isActive ? "Aktiv" : "Inaktiv"}
                          </Chip>
                        </div>
                      </div>

                      {/* Impact Warning for deactivation */}
                      {selectedEmployeeForToggle.isActive && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <p className="text-sm text-amber-700 flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>
                              <strong>Auswirkung:</strong> Der Mitarbeiter wird in zukünftigen Buchungsformularen nicht mehr angezeigt.
                              Bereits gebuchte Termine bleiben bestehen.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={() => {
                      onModalClose();
                      setSelectedEmployeeForToggle(null);
                    }}
                    isDisabled={toggling}
                    startContent={<X size={14} />}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    className={selectedEmployeeForToggle?.isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/20"
                      : "bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                    }
                    onPress={handleToggleConfirm}
                    isLoading={toggling}
                    startContent={!toggling && (selectedEmployeeForToggle?.isActive ? <UserX size={14} /> : <UserCheck size={14} />)}
                  >
                    {selectedEmployeeForToggle?.isActive ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Gesamt", value: employees.length, cls: "text-[#1E1E1E]" },
            { label: "Aktiv", value: activeCount, cls: "text-[#017172]" },
            { label: "Inaktiv", value: inactiveCount, cls: "text-[#8A8A8A]" },
          ].map(({ label, value, cls }) => (
            <Card key={label} className="border border-[#E8C7C3]/30 shadow-md">
              <CardBody className="p-4">
                <div className={`text-2xl sm:text-3xl font-bold ${cls}`}>{value}</div>
                <div className="text-xs text-[#8A8A8A] mt-0.5">{label}</div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-white border border-[#E8C7C3]/30 rounded-xl shadow-sm w-fit">
          <Switch
            isSelected={showInactive}
            onValueChange={setShowInactive}
            size="sm"
            color="default"
          />
          <span className="text-sm text-[#8A8A8A]">Inaktive anzeigen</span>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm mb-4">
            <AlertCircle size={16} />{error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#017172]" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#F5EDEB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-[#E8C7C3]" />
            </div>
            <p className="text-[#8A8A8A] font-medium">Noch keine Mitarbeiter vorhanden</p>
            <Button
              className="mt-4 bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold"
              startContent={<Plus size={16} />}
              onPress={openCreate}
            >
              Ersten Mitarbeiter hinzufügen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <Card key={emp.id}
                className={`border shadow-md transition-all hover:shadow-lg ${emp.isActive ? "border-[#E8C7C3]/30" : "border-[#E8C7C3]/10 opacity-60"}`}>
                <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarBg(emp.name)}`}>
                      {initials(emp.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[#1E1E1E]">{emp.name}</span>
                        <Chip size="sm" variant="flat"
                          className={emp.isActive ? "bg-[#017172]/10 text-[#017172]" : "bg-[#6b7280]/10 text-[#6b7280]"}>
                          {emp.isActive ? "Aktiv" : "Inaktiv"}
                        </Chip>
                      </div>
                      <p className="text-sm text-[#8A8A8A] font-medium">{emp.role}</p>
                      {emp.location && (
                        <p className="text-xs text-[#8A8A8A] mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {emp.location}
                        </p>
                      )}
                      {emp.specialty && <p className="text-xs text-[#8A8A8A] mt-1 italic">{emp.specialty}</p>}
                      {emp.username && (
                        <p className="text-xs text-[#8A8A8A] mt-1 flex items-center gap-1">
                          <Key size={10} /> {emp.username}
                        </p>
                      )}
                      {!emp.hasPassword && emp.username && (
                        <p className="text-xs text-amber-600 mt-1 font-medium">Kein Passwort gesetzt</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                        onPress={() => openEdit(emp)}
                        title="Bearbeiten"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="bg-[#F5EDEB] text-[#8A8A8A] hover:bg-[#E8C7C3]/30"
                        onPress={() => openSchedule(emp)}
                        title="Arbeitszeiten"
                      >
                        <Clock size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className={emp.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-[#017172]/10 text-[#017172] hover:bg-[#017172]/20"}
                        onPress={() => handleToggle(emp)}
                        title={emp.isActive ? "Deaktivieren" : "Aktivieren"}
                      >
                        {emp.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="bg-red-50 text-red-500 hover:bg-red-100"
                        onPress={() => handleDelete(emp)}
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => { onClose(); setModalErr(null); }}
        size="md" placement="center" classNames={MODAL_CLS}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#017172] flex items-center justify-center">
                    {editing ? <Edit size={16} className="text-white" /> : <Plus size={18} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">
                      {editing ? "Mitarbeiter bearbeiten" : "Mitarbeiter hinzufügen"}
                    </h2>
                    <p className="text-xs text-[#8A8A8A]">
                      {editing ? `${editing.name} bearbeiten` : "Neue Fachkraft anlegen"}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {modalErr && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                      <AlertCircle size={14} />{modalErr}
                    </div>
                  )}

                  <Input
                    label="Name"
                    placeholder="z.B. Anna Meier"
                    value={form.name}
                    isRequired={true}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    classNames={INPUT_CLS}
                  />

                  <Input
                    label="Rolle"
                    placeholder="z.B. Ästhetik-Expertin"
                    value={form.role}
                    isRequired={true}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    classNames={INPUT_CLS}
                  />

                  <Input
                    label="Spezialgebiet (optional)"
                    placeholder="z.B. Wimpern, Botox, Filler"
                    value={form.specialty ?? ""}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    classNames={INPUT_CLS}
                  />

                  {/* Location Field - New */}
                  <Input
                    label="Standort (optional)"
                    placeholder="z.B. Basel, Zürich, Bern"
                    value={form.location ?? ""}
                    isDisabled={submitting}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    classNames={INPUT_CLS}
                    startContent={<MapPin size={16} className="text-[#8A8A8A]" />}
                  />

                  {/* Username Field */}
                  <Input
                    label="Benutzername (für Login)"
                    placeholder="z.B. anna.meier"
                    value={form.username ?? ""}
                    isRequired={!editing ? true : false}
                    isDisabled={submitting || (!!editing && !resetPassword)}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    classNames={INPUT_CLS}
                    startContent={<Key size={16} className="text-[#8A8A8A]" />}
                  />

                  {/* Password Field - for new employees */}
                  {!editing && (
                    <Input
                      label="Passwort"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mindestens 8 Zeichen"
                      value={form.password ?? ""}
                      isRequired={true}
                      isDisabled={submitting}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      classNames={INPUT_CLS}
                      startContent={<Lock size={16} className="text-[#8A8A8A]" />}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[#8A8A8A] hover:text-[#017172] transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  )}

                  {/* Password Reset for existing employees */}
                  {editing && (
                    <>
                      {!resetPassword ? (
                        <div className="p-3 bg-[#F5EDEB] rounded-xl border border-[#E8C7C3]/30">
                          <p className="text-sm text-[#8A8A8A] mb-2">Passwort ändern?</p>
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-[#017172]/10 text-[#017172] font-semibold"
                            startContent={<Lock size={14} />}
                            onPress={() => setResetPassword(true)}
                          >
                            Neues Passwort setzen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            label="Neues Passwort"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Mindestens 8 Zeichen"
                            value={form.password ?? ""}
                            isRequired={true}
                            isDisabled={submitting}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            classNames={INPUT_CLS}
                            startContent={<Lock size={16} className="text-[#8A8A8A]" />}
                            endContent={
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="text-[#8A8A8A] hover:text-[#017172] transition-colors"
                                tabIndex={-1}
                              >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            }
                          />
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-red-50 text-red-500"
                            onPress={() => {
                              setResetPassword(false);
                              setForm({ ...form, password: "" });
                            }}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {editing && (
                    <div className="flex items-center gap-3 p-3 bg-[#F5EDEB] rounded-xl border border-[#E8C7C3]/30">
                      <Switch
                        isSelected={formActive}
                        onValueChange={setFormActive}
                        size="sm"
                        color="primary"
                        isDisabled={submitting}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1E1E1E]">{formActive ? "Aktiv" : "Inaktiv"}</p>
                        <p className="text-xs text-[#8A8A8A]">
                          {formActive ? "Erscheint in Buchungsformularen" : "Nicht buchbar – versteckt"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="gap-2">
                <Button
                  variant="flat"
                  className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                  onPress={close}
                  isDisabled={submitting}
                  startContent={<X size={14} />}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  isDisabled={
                    !form.name.trim() ||
                    !form.role.trim() ||
                    (!Boolean(editing) && (!form.username?.trim() || !form.password?.trim())) ||
                    (Boolean(editing) && resetPassword && !form.password?.trim())
                  }
                  startContent={!submitting && <Save size={14} />}
                >
                  {editing ? "Speichern" : "Hinzufügen"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleOpen} onClose={onScheduleClose} size="md" placement="center" classNames={MODAL_CLS}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8C7C3] flex items-center justify-center">
                    <Clock size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">Arbeitszeiten</h2>
                    <p className="text-xs text-[#8A8A8A]">{scheduleEmployee?.name}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {scheduleLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-[#E8C7C3]" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const item = schedule.find((s) => s.dayOfWeek === day.value)!;
                      return (
                        <div key={day.value} className={`rounded-xl p-3 border-2 transition-colors ${item.isWorkingDay ? 'border-[#E8C7C3]/40 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`sched-${day.value}`}
                              checked={item.isWorkingDay}
                              onChange={(e) => updateScheduleItem(day.value, 'isWorkingDay', e.target.checked)}
                              className="w-4 h-4 accent-[#E8C7C3] cursor-pointer"
                            />
                            <label htmlFor={`sched-${day.value}`} className={`font-semibold text-sm cursor-pointer w-8 ${item.isWorkingDay ? 'text-[#1E1E1E]' : 'text-[#8A8A8A]'}`}>
                              {day.label}
                            </label>
                            {item.isWorkingDay ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={item.startTime}
                                  onChange={(e) => updateScheduleItem(day.value, 'startTime', e.target.value)}
                                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-[#1E1E1E] bg-white"
                                />
                                <span className="text-[#8A8A8A] text-xs">–</span>
                                <input
                                  type="time"
                                  value={item.endTime}
                                  onChange={(e) => updateScheduleItem(day.value, 'endTime', e.target.value)}
                                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-[#1E1E1E] bg-white"
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-[#8A8A8A]">Frei</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {scheduleError && <p className="text-xs text-red-600">{scheduleError}</p>}
                    {scheduleSaved && <p className="text-xs text-green-600">Arbeitszeiten gespeichert!</p>}
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="gap-2">
                <Button variant="flat" className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold" onPress={close} startContent={<X size={14} />}>
                  Schließen
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white font-semibold"
                  onPress={saveSchedule}
                  isLoading={scheduleSaving}
                  startContent={!scheduleSaving && <Save size={14} />}
                >
                  Speichern
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {dialog}
    </div>
  );
}