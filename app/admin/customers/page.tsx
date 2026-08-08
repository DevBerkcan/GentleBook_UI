"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";
import { Chip } from "@nextui-org/chip";
import { Spinner } from "@nextui-org/spinner";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  X,
  Save,
  User as UserIcon,
  Clock,
  CalendarDays,
  AlertTriangle
} from "lucide-react";
import { customersApi, CustomerListItem, CustomerDetail } from "@/lib/api/customers";
import { adminApi } from "@/lib/api/admin";
import { CustomerLoyaltyPanel } from "@/components/admin/customers/CustomerLoyaltyPanel";
import { CustomerLoyaltyCardModal } from "@/components/admin/customers/CustomerLoyaltyCardModal";
import { useConfirm } from "@/components/ConfirmDialog";
import moment from "moment";
import { formatPrice } from "@/lib/utils/currency";

const modalClassNames = {
  base: "bg-white border border-[#ECEBF2]/30 shadow-2xl",
  header: "border-b border-[#ECEBF2]/20 bg-gradient-to-r from-[#F6F5FA] to-white",
  footer: "border-t border-[#ECEBF2]/20",
  body: "py-5",
};

const inputClassNames = {
  inputWrapper: "bg-[#F6F5FA] border border-[#ECEBF2]/30 hover:border-[#6355E4] data-[focus=true]:border-[#6355E4]",
};

type ModalMode = "create" | "edit" | "view";

export default function CustomersPage() {
  const { isEmployee } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteReason, setDeleteReason] = useState("");
  const [regularCustomerThreshold, setRegularCustomerThreshold] = useState<number | null>(null);
  const [showLoyaltyCard, setShowLoyaltyCard] = useState(false);

  useEffect(() => {
    adminApi.getLoyaltySettings()
      .then((s) => setRegularCustomerThreshold(s.rewardEveryNVisits > 0 ? s.rewardEveryNVisits : null))
      .catch(() => {});
  }, []);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const { confirm, dialog: confirmDialog } = useConfirm();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersApi.getAll(searchTerm || undefined, page, pageSize);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Kunden");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  async function loadCustomerDetails(id: string) {
    try {
      const customer = await customersApi.getById(id);
      setSelectedCustomer(customer);
    } catch (err: any) {
      /* silent */
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    });
    setModalError(null);
    onOpen();
  }

  function openEditModal(customer: CustomerDetail) {
    setModalMode("edit");
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
    });
    setModalError(null);
    onOpen();
  }

  function openViewModal(customer: CustomerListItem) {
    setModalMode("view");
    loadCustomerDetails(customer.id);
    setModalError(null);
    onOpen();
  }

  function openDeleteModal(customer: CustomerListItem) {
    setSelectedCustomer(null);
    loadCustomerDetails(customer.id).then(() => {
      onDeleteModalOpen();
    });
  }

  function handleClose() {
    onClose();
    setModalError(null);
    setSelectedCustomer(null);
  }

  async function handleSubmit() {
    if (!formData.firstName || !formData.lastName) {
      setModalError("Vor- und Nachname sind erforderlich");
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      if (modalMode === "create") {
        await customersApi.create({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
        });
      } else if (modalMode === "edit" && selectedCustomer) {
        await customersApi.update(selectedCustomer.id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
        });
      }

      await loadCustomers();
      handleClose();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || "Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!selectedCustomer) return;

    setDeleting(true);
    try {
      await customersApi.delete(selectedCustomer.id);
      await loadCustomers();
      onDeleteModalClose();
      setDeleteReason("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      loadCustomers();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "success";
      case "Pending": return "warning";
      case "Completed": return "primary";
      case "Cancelled": return "danger";
      case "NoShow": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Confirmed": return "Bestätigt";
      case "Pending": return "Ausstehend";
      case "Completed": return "Abgeschlossen";
      case "Cancelled": return "Storniert";
      case "NoShow": return "Nicht erschienen";
      default: return status;
    }
  };

  const MobileCustomerCard = ({ customer }: { customer: CustomerListItem }) => (
    <div className="bg-white border border-[#ECEBF2]/30 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6355E4] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {customer.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-[#1E1E1E] text-base flex items-center gap-1.5">
              {customer.fullName}
              {regularCustomerThreshold != null && customer.totalBookings >= regularCustomerThreshold && (
                <span title="Stammkunde">🎉</span>
              )}
            </div>
            <div className="text-xs text-[#8A8A8A] mt-0.5">ID: {customer.id.slice(-8)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
            <Mail size={14} className="text-[#6355E4] shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
            <Phone size={14} className="text-[#6355E4] shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
          <Calendar size={14} className="text-[#6355E4] shrink-0" />
          <span>
            Letzter Besuch: {customer.lastVisit
              ? moment(customer.lastVisit).format("DD.MM.YYYY")
              : "Noch kein Besuch"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#ECEBF2]/20">
        <Chip size="sm" variant="flat" className="bg-[#6355E4]/10 text-[#6355E4]">
          {customer.totalBookings} Buchungen
        </Chip>
        <div className="flex gap-2">
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
            onPress={async () => {
              const details = await customersApi.getById(customer.id);
              openEditModal(details);
            }}
          >
            <Edit size={14} />
          </Button>
          <Button
            size="sm"
            isIconOnly
            variant="flat"
            className="bg-red-50 text-red-500 hover:bg-red-100"
            onPress={() => openDeleteModal(customer)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] to-white py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">Kundenverwaltung</h1>
              {totalCount > 0 && (
                <span className="bg-[#6355E4]/10 text-[#6355E4] text-sm font-semibold px-3 py-1 rounded-full">
                  {totalCount}
                </span>
              )}
            </div>
            <p className="text-sm text-[#8A8A8A]">Kunden verwalten, suchen und bearbeiten</p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
            startContent={<Plus size={18} />}
            onPress={openCreateModal}
          >
            Neuer Kunde
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border border-[#ECEBF2]/30 shadow-lg">
          <CardBody className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Kunden suchen (Name, E-Mail, Telefon)..."
                startContent={<Search size={18} className="text-[#8A8A8A]" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                classNames={inputClassNames}
                className="flex-1"
              />
              <Button
                className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold"
                onPress={() => {
                  setPage(1);
                  loadCustomers();
                }}
              >
                Suchen
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Customers Table/Cards */}
        <Card className="border border-[#ECEBF2]/30 shadow-xl">
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A8A]">
                <UserIcon className="mx-auto mb-4 text-[#ECEBF2]" size={48} />
                <p className="font-medium">Keine Kunden gefunden</p>
                {searchTerm && (
                  <Button
                    size="sm"
                    className="mt-3 bg-[#F6F5FA] text-[#1E1E1E]"
                    onPress={() => {
                      setSearchTerm("");
                      setPage(1);
                      loadCustomers();
                    }}
                  >
                    Suche zurücksetzen
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F6F5FA] border-b border-[#ECEBF2]/30">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Kunde</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Kontakt</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Buchungen</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Letzter Besuch</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEBF2]/10">
                      {customers.map((customer, index) => (
                        <tr
                          key={customer.id}
                          className={`hover:bg-[#F6F5FA]/60 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#F6F5FA]/20"
                            }`}
                          onClick={() => openViewModal(customer)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#6355E4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {customer.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-[#1E1E1E] text-sm flex items-center gap-1.5">
                                  {customer.fullName}
                                  {regularCustomerThreshold != null && customer.totalBookings >= regularCustomerThreshold && (
                                    <span title="Stammkunde">🎉</span>
                                  )}
                                </div>
                                <div className="text-xs text-[#8A8A8A]">ID: {customer.id.slice(-8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {customer.email && (
                              <div className="flex items-center gap-1 text-xs text-[#8A8A8A] mb-1">
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate max-w-[200px]">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-xs text-[#8A8A8A]">
                                <Phone size={12} className="shrink-0" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Chip size="sm" variant="flat" className="bg-[#6355E4]/10 text-[#6355E4]">
                              {customer.totalBookings}
                            </Chip>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#8A8A8A]">
                            {customer.lastVisit
                              ? moment(customer.lastVisit).format("DD.MM.YYYY")
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                isIconOnly
                                variant="flat"
                                className="bg-[#F6F5FA] text-[#6355E4] hover:bg-[#6355E4]/10"
                                onPress={async () => {
                                  const details = await customersApi.getById(customer.id);
                                  openEditModal(details);
                                }}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                isIconOnly
                                variant="flat"
                                className="bg-red-50 text-red-500 hover:bg-red-100"
                                onPress={() => openDeleteModal(customer)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4">
                  {customers.map((customer) => (
                    <MobileCustomerCard key={customer.id} customer={customer} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[#ECEBF2]/20">
                    <div className="text-sm text-[#8A8A8A]">
                      Seite {page} von {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={page <= 1}
                        onPress={() => setPage(p => Math.max(1, p - 1))}
                        startContent={<ChevronLeft size={15} />}
                        className="bg-[#F6F5FA] text-[#1E1E1E] font-semibold"
                      >
                        Zurück
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={page >= totalPages}
                        onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                        endContent={<ChevronRight size={15} />}
                        className="bg-[#F6F5FA] text-[#1E1E1E] font-semibold"
                      >
                        Weiter
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen && (modalMode === "create" || modalMode === "edit")}
        onClose={handleClose}
        size="lg"
        placement="center"
        classNames={modalClassNames}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6355E4] flex items-center justify-center">
                    {modalMode === "edit" ? (
                      <Edit size={15} className="text-white" />
                    ) : (
                      <Plus size={15} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">
                      {modalMode === "edit" ? "Kunde bearbeiten" : "Neuen Kunde anlegen"}
                    </h2>
                    <p className="text-xs text-[#8A8A8A]">
                      {modalMode === "edit"
                        ? "Kundendaten aktualisieren"
                        : "Neuen Kunden zum System hinzufügen"}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  {modalError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
                      <AlertCircle size={14} /> {modalError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Vorname"
                      placeholder="Max"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      isRequired
                      isDisabled={submitting}
                      classNames={inputClassNames}
                    />
                    <Input
                      label="Nachname"
                      placeholder="Mustermann"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      isRequired
                      isDisabled={submitting}
                      classNames={inputClassNames}
                    />
                  </div>

                  <Input
                    label="E-Mail"
                    type="email"
                    placeholder="max@beispiel.de"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    isDisabled={submitting}
                    classNames={inputClassNames}
                    startContent={<Mail size={16} className="text-[#8A8A8A]" />}
                  />

                  <Input
                    label="Telefon"
                    placeholder="+41 76 123 45 67"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    isDisabled={submitting}
                    classNames={inputClassNames}
                    startContent={<Phone size={16} className="text-[#8A8A8A]" />}
                  />

                  <Input
                    label="Notizen (optional)"
                    placeholder="Besondere Hinweise, Präferenzen..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    isDisabled={submitting}
                    classNames={inputClassNames}
                  />
                </div>
              </ModalBody>

              <ModalFooter className="gap-2">
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  onPress={handleClose}
                  isDisabled={submitting}
                  startContent={<X size={14} />}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                  onPress={handleSubmit}
                  isLoading={submitting}
                  startContent={!submitting && <Save size={14} />}
                >
                  {modalMode === "edit" ? "Speichern" : "Anlegen"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isOpen && modalMode === "view"}
        onClose={handleClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={modalClassNames}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6355E4] flex items-center justify-center">
                    <UserIcon size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E1E1E]">Kundendetails</h2>
                    {selectedCustomer && (
                      <p className="text-xs text-[#8A8A8A]">Kunde seit {moment(selectedCustomer.createdAt).format("MMMM YYYY")}</p>
                    )}
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedCustomer ? (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Persönliche Daten</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#8A8A8A]">Vorname</p>
                          <p className="text-sm font-medium text-[#1E1E1E]">{selectedCustomer.firstName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8A8A8A]">Nachname</p>
                          <p className="text-sm font-medium text-[#1E1E1E]">{selectedCustomer.lastName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Kontakt</h3>
                      <div className="space-y-2">
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-[#6355E4] shrink-0" />
                            <a href={`mailto:${selectedCustomer.email}`} className="text-sm text-[#1E1E1E] hover:text-[#6355E4] break-all">
                              {selectedCustomer.email}
                            </a>
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-[#6355E4] shrink-0" />
                            <a href={`tel:${selectedCustomer.phone}`} className="text-sm text-[#1E1E1E] hover:text-[#6355E4]">
                              {selectedCustomer.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                      <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Statistiken</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">Buchungen gesamt</p>
                          <p className="text-xl font-bold text-[#6355E4]">{selectedCustomer.totalBookings}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">Nicht erschienen</p>
                          <p className="text-xl font-bold text-red-500">{selectedCustomer.noShowCount}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">Letzter Besuch</p>
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {selectedCustomer.lastVisit
                              ? moment(selectedCustomer.lastVisit).format("DD.MM.YYYY")
                              : "—"}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-xs text-[#8A8A8A]">Kunde seit</p>
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {moment(selectedCustomer.createdAt).format("DD.MM.YYYY")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Loyalty Points (Agency) */}
                    <CustomerLoyaltyPanel customerId={selectedCustomer.id} />

                    {/* Stammkunden-Kundenkarte (Agency) */}
                    {regularCustomerThreshold != null && (
                      <button
                        type="button"
                        onClick={() => setShowLoyaltyCard(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#F6F5FA] text-[#6355E4] hover:bg-[#ECEBF2] transition-colors border border-[#ECEBF2]/40"
                      >
                        🎉 Kundenkarte drucken
                      </button>
                    )}

                    {/* Notes */}
                    {selectedCustomer.notes && (
                      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-2">Notizen</h3>
                        <p className="text-sm text-[#1E1E1E] italic">"{selectedCustomer.notes}"</p>
                      </div>
                    )}

                    {/* Recent Bookings */}
                    {selectedCustomer.recentBookings.length > 0 && (
                      <div className="bg-[#F6F5FA] rounded-xl p-4 border border-[#ECEBF2]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Letzte Buchungen</h3>
                        <div className="space-y-2">
                          {selectedCustomer.recentBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="bg-white p-3 rounded-lg border border-[#ECEBF2]/20"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div>
                                  <p className="font-semibold text-[#1E1E1E] text-sm">{booking.serviceName}</p>
                                  <p className="text-xs text-[#8A8A8A] mt-1">
                                    {moment(booking.bookingDate).format("DD.MM.YYYY")} · {booking.startTime} – {booking.endTime}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                                  <Chip color={getStatusColor(booking.status)} size="sm" variant="flat">
                                    {getStatusLabel(booking.status)}
                                  </Chip>
                                  <p className="text-xs font-semibold text-[#6355E4] whitespace-nowrap">
                                    {formatPrice(booking.price, booking.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  startContent={<X size={14} />}
                  onPress={handleClose}
                >
                  Schließen
                </Button>
                {selectedCustomer && (
                  <Button
                    className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold shadow-lg shadow-[#6355E4]/20"
                    onPress={() => {
                      handleClose();
                      openEditModal(selectedCustomer);
                    }}
                  >
                    <Edit size={14} className="mr-2" />
                    Bearbeiten
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          onDeleteModalClose();
          setDeleteReason("");
        }}
        size="lg"
        placement="center"
        classNames={modalClassNames}
      >
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E1E1E]">Kunde löschen</h2>
                    <p className="text-xs text-[#8A8A8A]">
                      {selectedCustomer?.fullName}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                {selectedCustomer && (
                  <div className="space-y-4">
                    {/* Warning Message */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                      <p className="text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>
                          <strong>Achtung:</strong> Das Löschen eines Kunden ist endgültig und kann nicht rückgängig gemacht werden.
                        </span>
                      </p>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-[#F6F5FA] p-4 rounded-xl border border-[#ECEBF2]/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#6355E4] flex items-center justify-center text-white font-bold shrink-0">
                          {selectedCustomer.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1E1E]">{selectedCustomer.fullName}</p>
                          <p className="text-xs text-[#8A8A8A]">Kunde seit {moment(selectedCustomer.createdAt).format("DD.MM.YYYY")}</p>
                        </div>
                      </div>

                      {/* Booking Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-[#6355E4] shrink-0" />
                            <span className="text-xs text-[#8A8A8A]">Buchungen</span>
                          </div>
                          <p className="text-xl font-bold text-[#1E1E1E]">{selectedCustomer.totalBookings}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#6355E4] shrink-0" />
                            <span className="text-xs text-[#8A8A8A]">Letzter Besuch</span>
                          </div>
                          <p className="text-sm font-semibold text-[#1E1E1E]">
                            {selectedCustomer.lastVisit
                              ? moment(selectedCustomer.lastVisit).format("DD.MM.YYYY")
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Impact Warning */}
                    {selectedCustomer.totalBookings > 0 && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700 flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>
                            <strong>Auswirkung:</strong> Dieser Kunde hat <strong>{selectedCustomer.totalBookings} Buchungen</strong>.
                            Beim Löschen des Kunden werden auch alle zugehörigen Buchungen unwiderruflich gelöscht.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  className="bg-white border border-[#ECEBF2]/40 text-[#1E1E1E] font-semibold"
                  onPress={() => {
                    onModalClose();
                    setDeleteReason("");
                  }}
                  isDisabled={deleting}
                  startContent={<X size={14} />}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                  onPress={handleDeleteCustomer}
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

      {confirmDialog}

      {selectedCustomer && regularCustomerThreshold != null && (
        <CustomerLoyaltyCardModal
          open={showLoyaltyCard}
          onClose={() => setShowLoyaltyCard(false)}
          customerName={selectedCustomer.fullName}
          totalBookings={selectedCustomer.totalBookings}
          threshold={regularCustomerThreshold}
        />
      )}
    </div>
  );
}
