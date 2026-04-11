// app/admin/bookings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import { Textarea } from "@nextui-org/input";
import { Spinner } from "@nextui-org/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import {
  Search, ChevronLeft, ChevronRight, Edit, Filter, X, Calendar, CheckCircle,
  Trash2, AlertTriangle, Plus, Clock, User, Phone, Mail, Ban, Scissors, ChevronRight as ChevronRightIcon,
  Save, Check, Download, Send
} from "lucide-react";
import moment from "moment";

import {
  getBookings, updateBookingStatus, deleteBooking, getServices, createManualBooking,
  resendConfirmation, getBookingsExportUrl,
  type BookingListItem, type BookingFilter, type Service, type CreateManualBookingDto,
  type ManualBookingResponse,
  getServicesByEmployee,
  checkEmailConflict
} from "@/lib/api/admin";
import api from "@/lib/api/client";
import { getAvailability, getEmployees, type TimeSlot, type Employee } from "@/lib/api/booking";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { formatPrice } from "@/lib/utils/currency";

const modalClassNames = {
  base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
  header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
  footer: "border-t border-[#E8C7C3]/20",
  body: "py-5",
};

const manualBookingModalClassNames = {
  base: "bg-white border border-[#E8C7C3]/30 shadow-2xl",
  header: "border-b border-[#E8C7C3]/20 bg-gradient-to-r from-[#F5EDEB] to-white",
  footer: "border-t border-[#E8C7C3]/20 bg-[#F5EDEB]/30",
  body: "py-4"
};

export default function AdminBookingsPage() {
  const { employee, hasRole } = useAuth();
  const isAdmin = hasRole(['Admin', 'Owner']);

  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<ManualBookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<BookingFilter>({ page: 1, pageSize: 20 });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { isOpen: isStatusModalOpen, onOpen: onStatusModalOpen, onClose: onStatusModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const { isOpen: isManualBookingModalOpen, onOpen: onManualBookingModalOpen, onClose: onManualBookingModalClose } = useDisclosure();

  const [selectedBooking, setSelectedBooking] = useState<BookingListItem | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  // Add new state for booking details
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingListItem | null>(null);
  const { isOpen: isBookingDetailsModalOpen, onOpen: onBookingDetailsModalOpen, onClose: onBookingDetailsModalClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isServicePopoverOpen, setIsServicePopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // In AdminBookingsPage component, add these states
  const [employeeServices, setEmployeeServices] = useState<Service[]>([]);
  const [loadingEmployeeServices, setLoadingEmployeeServices] = useState(false);

  // Add function to load services when employee changes
  async function loadServicesForEmployee(employeeId: string) {
    if (!employeeId) return;

    setLoadingEmployeeServices(true);
    try {
      const data = await getServicesByEmployee(employeeId);
      setEmployeeServices(data);
    } catch (error) {
      console.error("Error loading employee services:", error);
      setEmployeeServices([]);
    } finally {
      setLoadingEmployeeServices(false);
    }
  }

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setBookingForm(prev => ({ ...prev, serviceId: '' }));
    loadServicesForEmployee(employeeId);
  };


  const [bookingForm, setBookingForm] = useState<{
    serviceId: string;
    bookingDate: string;
    startTime: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    customerNotes: string;
  }>({
    serviceId: '',
    bookingDate: moment().format('YYYY-MM-DD'),
    startTime: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerNotes: ''
  });

  const { confirm, dialog: confirmDialog } = useConfirm();

  // Load data on mount
  useEffect(() => {
    loadBookings();
    loadServices();
    loadEmployees();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  function openBookingDetails(booking: BookingListItem) {
    setSelectedBookingDetails(booking);
    setIsEditMode(false);
    setResendSuccess(false);
    onBookingDetailsModalOpen();
  }

  function openBookingEdit(booking: BookingListItem) {
    setSelectedBookingDetails(booking);
    setIsEditMode(true);
    // Pre-fill form data if needed
    onBookingDetailsModalOpen();
  }

  async function loadEmployees() {
    try {
      const data = await getEmployees();
      setEmployees(data);
      if (data.length > 0) setSelectedEmployeeId(data[0].id);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function loadServices() {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  }

  async function loadBookings() {
    setLoading(true);
    try {
      // Only add all=true for admin users, otherwise show only user's bookings
      const response = await getBookings(filter);
      setBookings(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
      setTotalCount(response.totalCount);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots() {
    if (!bookingForm.serviceId || !bookingForm.bookingDate || !selectedEmployeeId) {
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      // Pass employeeId to getAvailability
      const data = await getAvailability(bookingForm.serviceId, bookingForm.bookingDate, selectedEmployeeId);
      const available = data.availableSlots?.filter(slot => slot.isAvailable) || [];
      setAvailableSlots(available);

      if (bookingForm.startTime) {
        const isStillAvailable = available.some(slot => slot.startTime === bookingForm.startTime);
        if (!isStillAvailable) setBookingForm(prev => ({ ...prev, startTime: '' }));
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (bookingForm.serviceId && bookingForm.bookingDate && selectedEmployeeId) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [bookingForm.serviceId, bookingForm.bookingDate, selectedEmployeeId]);

  const commitSearch = useCallback(() => {
    setFilter(prev => ({ ...prev, searchTerm: searchInput.trim() || undefined, page: 1 }));
  }, [searchInput]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitSearch();
  };

  function handleFilterChange(key: keyof BookingFilter, value: string) {
    setFilter(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  function clearAllFilters() {
    setSearchInput("");
    setFilter({ page: 1, pageSize: 20 });
    setShowMobileFilters(false);
  }

  function handlePageChange(newPage: number) {
    setFilter(prev => ({ ...prev, page: newPage }));
  }

  function openStatusModal(booking: BookingListItem) {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setAdminNotes("");
    onStatusModalOpen();
  }

  function openDeleteModal(booking: BookingListItem) {
    setSelectedBooking(booking);
    setDeleteReason("");
    onDeleteModalOpen();
  }

  const resetManualBookingForm = () => {
    setSuccess(false);
    setCreatedBooking(null);
    setError(null);
    if (employees.length > 0) setSelectedEmployeeId(employees[0].id);
    setBookingForm({
      serviceId: '',
      bookingDate: moment().format('YYYY-MM-DD'),
      startTime: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      customerNotes: ''
    });
    setAvailableSlots([]);

    if (employees.length > 0) {
      const firstEmployeeId = employees[0].id;
      setSelectedEmployeeId(firstEmployeeId);
      // Load services for the first employee immediately
      loadServicesForEmployee(firstEmployeeId);
    }
  };

  async function handleStatusUpdate() {
    if (!selectedBooking) return;
    setUpdating(true);
    try {
      await updateBookingStatus(selectedBooking.id, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });
      await loadBookings();
      onStatusModalClose();
    } catch (err: any) {
      alert("Fehler beim Aktualisieren: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteBooking() {
    if (!selectedBooking) return;

    setDeleting(true);
    try {
      await deleteBooking(selectedBooking.id, deleteReason || undefined);
      await loadBookings();
      onDeleteModalClose();
    } catch (err: any) {
      alert("Fehler beim Löschen: " + err.message);
    } finally {
      setDeleting(false);
    }
  }
  // Add these state variables
  const [showEmailConflictModal, setShowEmailConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    existingName: string;
    existingEmail: string;
    bookingData: CreateManualBookingDto;
  } | null>(null);

  async function handleCreateManualBooking() {
    setError(null);

    try {
      const selectedService = employeeServices.find(s => s.id === bookingForm.serviceId) ||
        services.find(s => s.id === bookingForm.serviceId);
      if (!selectedService) throw new Error("Service nicht gefunden");

      const availabilityCheck = await getAvailability(
        bookingForm.serviceId,
        bookingForm.bookingDate,
        selectedEmployeeId
      );

      const isSlotAvailable = availabilityCheck.availableSlots?.some(
        slot => slot.startTime === bookingForm.startTime && slot.isAvailable
      );
      if (!isSlotAvailable) throw new Error("Dieser Zeitslot ist nicht mehr verfügbar.");

      const bookingData: CreateManualBookingDto = {
        serviceId: bookingForm.serviceId,
        bookingDate: bookingForm.bookingDate,
        startTime: bookingForm.startTime,
        firstName: bookingForm.firstName.trim(),
        lastName: bookingForm.lastName.trim(),
        email: bookingForm.email?.trim() || null,
        phone: bookingForm.phone?.trim() || null,
        customerNotes: bookingForm.customerNotes?.trim() || null,
        employeeId: selectedEmployeeId || null,
      };

      // THIS IS THE KEY PART - ACTUALLY CALL checkEmailConflict
      if (bookingData.email) {
        const conflictCheck = await checkEmailConflict(
          bookingData.email,
          bookingData.firstName,
          bookingData.lastName,
          selectedEmployeeId
        );

        if (conflictCheck.hasConflict) {
          // Show warning modal - PREVENTS booking creation
          setConflictData({
            existingName: conflictCheck.existingName!,
            existingEmail: conflictCheck.existingEmail!,
            bookingData
          });
          setShowEmailConflictModal(true);
          return; // IMPORTANT: Stop here, don't create booking
        }
      }

      // No conflict, proceed directly
      await submitBooking(bookingData);

    } catch (error: any) {
      console.error("Error preparing booking:", error);
      setError(error.message || "Fehler beim Erstellen der Buchung");
    }
  }

  async function submitBooking(bookingData: CreateManualBookingDto) {
    setSubmitting(true);
    try {
      const booking = await createManualBooking(bookingData);
      setCreatedBooking(booking);
      setSuccess(true);
      await loadBookings();

      setTimeout(() => {
        onManualBookingModalClose();
        resetManualBookingForm();
      }, 3000);
    } catch (error: any) {
      console.error("Error creating manual booking:", error);
      setError(error.message || "Fehler beim Erstellen der Buchung");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConflictConfirmed() {
    if (!conflictData) return;

    // Set submitting to true to show loading state
    setSubmitting(true);

    try {
      // Now execute the booking creation with the confirmed data
      const booking = await createManualBooking(conflictData.bookingData);
      setCreatedBooking(booking);
      setSuccess(true);
      await loadBookings();

      // Close the conflict modal
      setShowEmailConflictModal(false);
      setConflictData(null);

      // Close the manual booking modal after success
      setTimeout(() => {
        onManualBookingModalClose();
        resetManualBookingForm();
      }, 3000);
    } catch (error: any) {
      console.error("Error creating manual booking:", error);
      setError(error.message || "Fehler beim Erstellen der Buchung");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation(bookingId: string) {
    setResending(true);
    setResendSuccess(false);
    try {
      await resendConfirmation(bookingId);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      alert("Fehler: " + (err.response?.data?.message || err.message));
    } finally {
      setResending(false);
    }
  }

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      const url = await getBookingsExportUrl({ status: filter.status, fromDate: filter.fromDate, toDate: filter.toDate });
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `buchungen_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      alert("Export fehlgeschlagen: " + err.message);
    } finally {
      setExportLoading(false);
    }
  }

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

  const statusOptions = [
    { value: "", label: "Alle Status" },
    { value: "Pending", label: "Ausstehend" },
    { value: "Confirmed", label: "Bestätigt" },
    { value: "Completed", label: "Abgeschlossen" },
    { value: "Cancelled", label: "Storniert" },
    { value: "NoShow", label: "Nicht erschienen" },
  ];

  const hasActiveFilters = !!(filter.searchTerm || filter.status || filter.fromDate || filter.toDate);

  const inputClassNames = {
    input: "text-[#1E1E1E]",
    inputWrapper: "bg-white border border-[#E8C7C3]/40 hover:border-[#017172] data-[focus=true]:border-[#017172]",
    label: "text-[#8A8A8A]",
  };

  const selectedService = services.find(s => s.id === bookingForm.serviceId);
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MobileBookingCard = ({ booking }: { booking: BookingListItem }) => (
    <div className="bg-white border border-[#E8C7C3]/30 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-mono text-xs font-semibold text-[#8A8A8A]">{booking.bookingNumber}</div>
          <div className="font-semibold text-[#1E1E1E] mt-0.5">{booking.customerName}</div>
        </div>
        <Chip color={getStatusColor(booking.status)} size="sm" variant="flat">
          {getStatusLabel(booking.status)}
        </Chip>
      </div>
      <div className="text-sm text-[#8A8A8A] space-y-1 mb-3">
        <div>{new Date(booking.bookingDate).toLocaleDateString("de-DE")} · {booking.startTime} – {booking.endTime}</div>
        <div>{booking.serviceName}</div>
        {booking.customerEmail && <div className="break-all">{booking.customerEmail}</div>}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#E8C7C3]/20">
        <div className="font-bold text-[#017172]">{formatPrice(booking.price, booking.currency)}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold"
            startContent={<Edit size={13} />}
            onPress={() => openStatusModal(booking)}
          >

          </Button>
          <Button
            size="sm"
            variant="flat"
            className="bg-red-50 text-red-500 min-w-0 px-2"
            startContent={<Trash2 size={13} />}
            onPress={() => openDeleteModal(booking)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">Buchungsverwaltung</h1>
              {totalCount > 0 && (
                <span className="bg-[#017172]/10 text-[#017172] text-sm font-semibold px-3 py-1 rounded-full">
                  {totalCount}
                </span>
              )}
            </div>
            <p className="text-sm text-[#8A8A8A]">
              {isAdmin ? "Alle Buchungen verwalten (Admin)" : "Ihre persönlichen Buchungen verwalten"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="flat"
              className="bg-white border border-[#E8C7C3]/40 text-[#017172] font-semibold"
              startContent={exportLoading
                ? <span className="w-4 h-4 rounded-full border-2 border-[#017172]/30 border-t-[#017172] animate-spin" />
                : <Download size={16} />}
              onPress={handleExportCsv}
              isDisabled={exportLoading}
            >
              CSV Export
            </Button>
            <Button
              className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
              startContent={<Plus size={18} />}
              onPress={() => {
                resetManualBookingForm();
                onManualBookingModalOpen();
              }}
            >
              Buchung erstellen
            </Button>
          </div>
        </div>

        {/* ── Desktop filter bar ─────────────────────────────────────────── */}
        <Card className="hidden md:block mb-6 border border-[#E8C7C3]/30 shadow-lg">
          <CardBody className="p-5">
            <div className="grid grid-cols-5 gap-3 items-end">
              <div className="col-span-2 flex gap-2">
                <Input
                  label="Suchen"
                  placeholder="Name, E-Mail, Telefon..."
                  startContent={<Search size={16} className="text-[#8A8A8A]" />}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  classNames={inputClassNames}
                />
                <Button
                  className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold self-end h-14 px-4"
                  onPress={commitSearch}
                >
                  <Search size={16} />
                </Button>
              </div>

              <Select
                label="Status"
                selectedKeys={filter.status ? [filter.status] : [""]}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                classNames={{
                  trigger: "bg-white border border-[#E8C7C3]/40 hover:border-[#017172]",
                  label: "text-[#8A8A8A]",
                }}
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </Select>

              <Input type="date" label="Von" value={filter.fromDate || ""}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)} classNames={inputClassNames} />
              <Input type="date" label="Bis" value={filter.toDate || ""}
                onChange={(e) => handleFilterChange("toDate", e.target.value)} classNames={inputClassNames} />
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E8C7C3]/20">
                <span className="text-xs text-[#8A8A8A]">Aktive Filter:</span>
                {filter.searchTerm && (
                  <span className="text-xs bg-[#017172]/10 text-[#017172] px-2 py-0.5 rounded-full font-medium">
                    "{filter.searchTerm}"
                  </span>
                )}
                {filter.status && (
                  <span className="text-xs bg-[#017172]/10 text-[#017172] px-2 py-0.5 rounded-full font-medium">
                    {getStatusLabel(filter.status)}
                  </span>
                )}
                <Button size="sm" variant="flat" className="bg-red-50 text-red-500 text-xs ml-auto"
                  startContent={<X size={12} />} onPress={clearAllFilters}>
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Booking Details Modal */}
        <Modal
          isOpen={isBookingDetailsModalOpen}
          onClose={onBookingDetailsModalClose}
          size="2xl"
          scrollBehavior="inside"
          classNames={modalClassNames}
        >
          <ModalContent>
            {(onModalClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
                      <Calendar size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1E1E1E]">
                        {isEditMode ? "Buchung bearbeiten" : "Buchungsdetails"}
                      </h2>
                      {selectedBookingDetails && (
                        <p className="text-xs text-[#8A8A8A]">
                          {selectedBookingDetails.bookingNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {selectedBookingDetails && (
                    <div className="space-y-4">
                      {/* Service Info */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Service</h3>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-[#1E1E1E]">{selectedBookingDetails.serviceName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={13} className="text-[#017172]" />
                              <p className="text-xs text-[#8A8A8A]">
                                {selectedBookingDetails.startTime} – {selectedBookingDetails.endTime}
                              </p>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-[#017172]">
                            {formatPrice(selectedBookingDetails.price, selectedBookingDetails.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Kunde</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-sm">
                            {selectedBookingDetails.customerName.charAt(0)}
                          </div>
                          <p className="font-medium text-[#1E1E1E]">{selectedBookingDetails.customerName}</p>
                        </div>
                        <div className="space-y-2">
                          {selectedBookingDetails.customerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-[#017172]" />
                              <a href={`mailto:${selectedBookingDetails.customerEmail}`}
                                className="text-sm text-[#1E1E1E] hover:text-[#017172] break-all">
                                {selectedBookingDetails.customerEmail}
                              </a>
                            </div>
                          )}
                          {selectedBookingDetails.customerPhone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-[#017172]" />
                              <a href={`tel:${selectedBookingDetails.customerPhone}`}
                                className="text-sm text-[#1E1E1E] hover:text-[#017172]">
                                {selectedBookingDetails.customerPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Status</h3>
                        <Chip color={getStatusColor(selectedBookingDetails.status)} size="md" variant="flat">
                          {getStatusLabel(selectedBookingDetails.status)}
                        </Chip>
                      </div>

                      {/* Notes */}
                      {selectedBookingDetails.customerNotes && (
                        <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                          <h3 className="font-semibold text-[#1E1E1E] text-sm mb-2">Notizen</h3>
                          <p className="text-sm text-[#1E1E1E] italic">"{selectedBookingDetails.customerNotes}"</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                        <h3 className="font-semibold text-[#1E1E1E] text-sm mb-3">Zeitstempel</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-[#8A8A8A]">Erstellt am</p>
                            <p className="text-sm font-semibold text-[#1E1E1E]">
                              {moment(selectedBookingDetails.createdAt).format("DD.MM.YYYY HH:mm")}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-[#8A8A8A]">Datum</p>
                            <p className="text-sm font-semibold text-[#1E1E1E]">
                              {moment(selectedBookingDetails.bookingDate).format("DD.MM.YYYY")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter>
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    startContent={<X size={14} />}
                    onPress={onModalClose}
                  >
                    Schließen
                  </Button>
                  {!isEditMode && selectedBookingDetails?.status !== 'Cancelled' && (
                    <Button
                      variant="flat"
                      className={resendSuccess
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold"
                        : "bg-[#F5EDEB] text-[#017172] border border-[#E8C7C3]/40 font-semibold"}
                      startContent={resendSuccess
                        ? <CheckCircle size={14} />
                        : resending
                          ? <span className="w-3.5 h-3.5 rounded-full border-2 border-[#017172]/30 border-t-[#017172] animate-spin" />
                          : <Send size={14} />}
                      isDisabled={resending}
                      onPress={() => handleResendConfirmation(selectedBookingDetails!.id)}
                    >
                      {resendSuccess ? 'Gesendet!' : 'Bestätigung senden'}
                    </Button>
                  )}
                  {!isEditMode && (
                    <Button
                      className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                      onPress={() => openStatusModal(selectedBookingDetails!)}
                    >
                      <Edit size={14} className="mr-2" />
                      Status ändern
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Email Conflict Warning Modal */}
        <Modal
          isOpen={showEmailConflictModal}
          onClose={() => {
            setShowEmailConflictModal(false);
            setConflictData(null);
          }}
          size="md"
          placement="center"
          classNames={modalClassNames}
        >
          <ModalContent>
            {(onModalClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#1E1E1E]">Kunde bereits vorhanden</h2>
                    </div>
                  </div>
                </ModalHeader>

                <ModalBody>
                  {conflictData && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700">
                          Die E-Mail <strong>{conflictData.existingEmail}</strong> ist bereits dem Kunden
                          <strong> {conflictData.existingName}</strong> der Fachkraft{' '}
                          <strong>{employees.find(e => e.id === selectedEmployeeId)?.name}</strong> zugeordnet.
                        </p>

                      </div>

                      <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                        <p className="text-sm text-[#1E1E1E] font-medium mb-3">Was passiert jetzt?</p>
                        <ul className="text-sm text-[#8A8A8A] space-y-3">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#017172] mt-1.5"></span>
                            <span>
                              Der Name des bestehenden Kunden wird von{' '}
                              <strong className="text-[#1E1E1E]">{conflictData.existingName}</strong> zu{' '}
                              <strong className="text-[#1E1E1E]">{conflictData.bookingData.firstName} {conflictData.bookingData.lastName}</strong> geändert.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#017172] mt-1.5"></span>
                            <span>
                              Diese Änderung betrifft <strong>alle vergangenen und zukünftigen Buchungen</strong> dieses Kunden.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#017172] mt-1.5"></span>
                            <span>
                              Die Buchung wird mit den neuen Kundendaten erstellt.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-2">
                  <Button
                    variant="flat"
                    className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                    onPress={() => {
                      setShowEmailConflictModal(false);
                      setConflictData(null);
                    }}
                    startContent={<X size={14} />}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/20"
                    onPress={handleConflictConfirmed}
                    isLoading={submitting}
                    startContent={<Check size={14} />}
                  >
                    Trotzdem fortfahren
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* ── Mobile filters ─────────────────────────────────────────────── */}
        <div className="md:hidden mb-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Suchen..."
              startContent={<Search size={16} className="text-[#8A8A8A]" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/40" }}
              className="flex-1"
            />
            <Button className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold" onPress={commitSearch}>
              <Search size={16} />
            </Button>
            <Button variant="flat" className="bg-[#F5EDEB] text-[#1E1E1E]"
              startContent={<Filter size={16} />} onPress={() => setShowMobileFilters(!showMobileFilters)}>
              Filter
            </Button>
          </div>

          {showMobileFilters && (
            <Card className="border border-[#E8C7C3]/30">
              <CardBody className="p-4 space-y-3">
                <Select label="Status" selectedKeys={filter.status ? [filter.status] : [""]}
                  onChange={(e) => handleFilterChange("status", e.target.value)} size="sm">
                  {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </Select>
                <Input type="date" label="Von Datum" value={filter.fromDate || ""}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)} size="sm" />
                <Input type="date" label="Bis Datum" value={filter.toDate || ""}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)} size="sm" />
                {hasActiveFilters && (
                  <Button size="sm" variant="flat" className="bg-red-50 text-red-500 w-full"
                    startContent={<X size={14} />} onPress={clearAllFilters}>
                    Alle Filter zurücksetzen
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* ── Bookings table ─────────────────────────────────────────────── */}
        <Card className="border border-[#E8C7C3]/30 shadow-xl">
          <CardBody className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#017172]" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A8A]">
                <Calendar className="mx-auto mb-4 text-[#E8C7C3]" size={40} />
                <p className="font-medium">Keine Buchungen gefunden</p>
                {hasActiveFilters && (
                  <Button size="sm" className="mt-3 bg-[#F5EDEB] text-[#1E1E1E]" onPress={clearAllFilters}>
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F5EDEB] border-b border-[#E8C7C3]/30">
                      <tr>
                        {["Buchungsnr.", "Datum & Zeit", "Kunde", "Service", "Status", "Preis", "Aktionen"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[#8A8A8A] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8C7C3]/10">
                      {bookings.map((booking, index) => (
                        <tr key={booking.id}
                          onClick={() => openBookingDetails(booking)}
                          className={`hover:bg-[#F5EDEB]/60 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#F5EDEB]/20"}`}>
                          <td className="px-5 py-4">
                            <div className="font-mono text-xs text-[#8A8A8A]">{booking.bookingNumber}</div>
                            <div className="text-xs text-[#8A8A8A] mt-0.5">{new Date(booking.createdAt).toLocaleDateString("de-DE")}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#1E1E1E] text-sm">{new Date(booking.bookingDate).toLocaleDateString("de-DE")}</div>
                            <div className="text-xs text-[#8A8A8A]">{booking.startTime} – {booking.endTime}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#1E1E1E] text-sm">{booking.customerName}</div>
                            <div className="text-xs text-[#8A8A8A] break-all">{booking.customerEmail}</div>
                            <div className="text-xs text-[#8A8A8A]">{booking.customerPhone}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-[#1E1E1E]">{booking.serviceName}</div>
                            {booking.customerNotes && (
                              <div className="text-xs text-[#8A8A8A] mt-1 max-w-xs truncate">💬 {booking.customerNotes}</div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Chip color={getStatusColor(booking.status)} size="sm" variant="flat">
                              {getStatusLabel(booking.status)}
                            </Chip>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-[#017172] text-sm">{formatPrice(booking.price, booking.currency)}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm"
                                isIconOnly
                                variant="flat"
                                className="bg-[#F5EDEB] text-[#017172] hover:bg-[#017172]/10"
                                startContent={<Edit size={13} />}
                                onPress={() => openStatusModal(booking)}>

                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="bg-red-50 text-red-500 hover:bg-red-100 min-w-0 px-2"
                                startContent={<Trash2 size={13} />}
                                onPress={() => openDeleteModal(booking)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden p-4">
                  {bookings.map(b => <MobileBookingCard key={b.id} booking={b} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[#E8C7C3]/20">
                    <div className="text-sm text-[#8A8A8A]">Seite {currentPage} von {totalPages}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" isDisabled={currentPage === 1}
                        onPress={() => handlePageChange(currentPage - 1)}
                        startContent={<ChevronLeft size={15} />}
                        className="bg-[#F5EDEB] text-[#1E1E1E] font-semibold">
                        Zurück
                      </Button>
                      <Button size="sm" variant="flat" isDisabled={currentPage === totalPages}
                        onPress={() => handlePageChange(currentPage + 1)}
                        endContent={<ChevronRight size={15} />}
                        className="bg-[#F5EDEB] text-[#1E1E1E] font-semibold">
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

      {/* ── Status update modal ────────────────────────────────────────────── */}
      <Modal isOpen={isStatusModalOpen} onClose={onStatusModalClose} size="md" placement="center" classNames={modalClassNames}>
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#017172] flex items-center justify-center">
                    <CheckCircle size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">Status aktualisieren</h2>
                    <p className="text-xs text-[#8A8A8A]">{selectedBooking?.bookingNumber}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedBooking && (
                  <div className="space-y-4">
                    <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                      <div className="font-semibold text-[#1E1E1E] text-sm">{selectedBooking.customerName}</div>
                      <div className="text-xs text-[#8A8A8A] mt-1">{selectedBooking.serviceName}</div>
                      <div className="text-xs text-[#8A8A8A]">
                        {new Date(selectedBooking.bookingDate).toLocaleDateString("de-DE")} · {selectedBooking.startTime}
                      </div>
                    </div>

                    <Select
                      label="Neuer Status"
                      selectedKeys={[newStatus]}
                      onChange={(e) => setNewStatus(e.target.value)}
                      isRequired
                      classNames={{
                        trigger: "bg-white border border-[#E8C7C3]/40 hover:border-[#017172]",
                        label: "text-[#8A8A8A]",
                      }}
                    >
                      <SelectItem key="Pending" value="Pending">Ausstehend</SelectItem>
                      <SelectItem key="Confirmed" value="Confirmed">Bestätigt</SelectItem>
                      <SelectItem key="Completed" value="Completed">Abgeschlossen</SelectItem>
                      <SelectItem key="NoShow" value="NoShow">Nicht erschienen</SelectItem>
                      <SelectItem key="Cancelled" value="Cancelled">Storniert</SelectItem>
                    </Select>

                    <Textarea
                      label="Admin Notizen (optional)"
                      placeholder="z.B. Telefonisch bestätigt..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      minRows={3}
                      classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/40 hover:border-[#017172]" }}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold" startContent={<X size={14} />} onPress={onModalClose}>
                  Abbrechen
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                  onPress={handleStatusUpdate}
                  isLoading={updating}
                  startContent={!submitting && <Save size={14} />}
                  isDisabled={!newStatus}
                >
                  Speichern
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} size="md" placement="center" classNames={modalClassNames}>
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1E1E1E]">Buchung löschen</h2>
                    <p className="text-xs text-[#8A8A8A]">{selectedBooking?.bookingNumber}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedBooking && (
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                      <p className="text-sm text-red-700">
                        <strong>Achtung:</strong> Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>
                    </div>

                    <div className="bg-[#F5EDEB] p-4 rounded-xl border border-[#E8C7C3]/30">
                      <div className="font-semibold text-[#1E1E1E] text-sm">{selectedBooking.customerName}</div>
                      <div className="text-xs text-[#8A8A8A] mt-1">{selectedBooking.serviceName}</div>
                      <div className="text-xs text-[#8A8A8A]">
                        {new Date(selectedBooking.bookingDate).toLocaleDateString("de-DE")} · {selectedBooking.startTime} – {selectedBooking.endTime}
                      </div>
                    </div>

                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold" startContent={<X size={14} />} onPress={onModalClose}>
                  Abbrechen
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-500/20"
                  onPress={handleDeleteBooking}
                  isLoading={deleting}
                  startContent={<Trash2 size={14} />}
                >
                  Endgültig löschen
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── Manual Booking Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isManualBookingModalOpen}
        onClose={() => { onManualBookingModalClose(); resetManualBookingForm(); }}
        size="2xl"
        scrollBehavior="inside"
        classNames={manualBookingModalClassNames}
      >
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
                    <Plus size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E1E1E]">Manuelle Buchung</h2>
                    <p className="text-xs text-[#8A8A8A]">Termin manuell für einen Kunden anlegen</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {success && createdBooking ? (
                  <div className="flex-1">
                    <div className="bg-[#F5EDEB] rounded-xl border-2 border-[#E8C7C3]/30 shadow-lg overflow-hidden">
                      <div className="p-5 border-b-2 border-[#E8C7C3]/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#017172] flex items-center justify-center">
                            <CheckCircle size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#1E1E1E]">Buchung erfolgreich!</h3>
                            <p className="text-xs text-[#8A8A8A] font-mono">Nr: {createdBooking.bookingNumber}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 border-b-2 border-[#E8C7C3]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
                            <Scissors size={16} className="text-[#017172]" />
                          </div>
                          <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Service</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#1E1E1E] text-base">{createdBooking.booking.serviceName}</p>
                          <p className="text-xl font-bold text-[#017172]">{formatPrice(createdBooking.booking.price, createdBooking.booking.currency)}</p>
                        </div>
                      </div>

                      <div className="p-5 border-b-2 border-[#E8C7C3]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
                            <Calendar size={16} className="text-[#017172]" />
                          </div>
                          <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Datum & Zeit</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[#1E1E1E] font-medium">
                            {new Date(createdBooking.booking.bookingDate).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#8A8A8A]" />
                            <p className="text-[#1E1E1E]">
                              {createdBooking.booking.startTime} – {createdBooking.booking.endTime} Uhr
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 border-b-2 border-[#E8C7C3]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
                            <User size={16} className="text-[#017172]" />
                          </div>
                          <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Kunde</span>
                        </div>
                        <p className="text-[#1E1E1E] font-medium text-base">
                          {createdBooking.customer.firstName} {createdBooking.customer.lastName}
                        </p>
                      </div>

                      {createdBooking.employee && (
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-[#017172]/10 flex items-center justify-center">
                              <User size={16} className="text-[#017172]" />
                            </div>
                            <span className="font-semibold text-[#1E1E1E] text-sm uppercase tracking-wide">Fachkraft</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#017172] flex items-center justify-center text-white font-bold text-sm">
                              {createdBooking.employee.name.charAt(0)}
                            </div>
                            <p className="text-[#1E1E1E] font-medium">{createdBooking.employee.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                    {/* Step 1: Employee */}
                    <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                      <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">1. Fachkraft wählen</p>
                      {loadingEmployees ? (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                          <Spinner size="sm" />
                          <span className="text-sm text-[#8A8A8A]">Lade Mitarbeiter...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {employees.map(emp => (
                            <button
                              key={emp.id}
                              onClick={() => handleEmployeeSelect(emp.id)}
                              className={`text-left p-3 rounded-xl border-2 transition-all ${selectedEmployeeId === emp.id
                                ? 'border-[#017172] bg-[#017172]/5'
                                : 'border-[#E8C7C3]/30 bg-white hover:border-[#017172]/30'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedEmployeeId === emp.id
                                  ? 'bg-[#017172] text-white'
                                  : 'bg-[#E8C7C3]/20 text-[#017172]'
                                  }`}>
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#1E1E1E] text-sm">{emp.name}</p>
                                  <p className="text-[10px] text-[#8A8A8A]">{emp.role}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step 2: Service with integrated search */}
                    <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                      <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">2. Service auswählen</p>

                      {!selectedEmployeeId ? (
                        <div className="p-3 bg-white rounded-lg text-center text-sm text-[#8A8A8A]">
                          Bitte zuerst eine Fachkraft auswählen
                        </div>
                      ) : loadingEmployeeServices ? (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                          <Spinner size="sm" />
                          <span className="text-sm text-[#8A8A8A]">Lade Services...</span>
                        </div>
                      ) : (
                        <Popover placement="bottom" isOpen={isServicePopoverOpen} onOpenChange={setIsServicePopoverOpen}>
                          <PopoverTrigger>
                            <Button
                              variant="flat"
                              className="w-full justify-start bg-white border border-[#E8C7C3]/30 text-[#1E1E1E] h-12"
                              endContent={<Search size={18} className="text-[#8A8A8A]" />}
                              isDisabled={!selectedEmployeeId}
                            >
                              {bookingForm.serviceId ?
                                (employeeServices.find(s => s.id === bookingForm.serviceId)?.name ||
                                  services.find(s => s.id === bookingForm.serviceId)?.name ||
                                  "Service auswählen...")
                                : "Service suchen oder auswählen..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <div className="w-full">
                              <Input
                                placeholder="Service suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-b border-[#E8C7C3]/20"
                                startContent={<Search size={18} className="text-[#8A8A8A]" />}
                                classNames={{
                                  inputWrapper: "bg-transparent shadow-none",
                                  base: "p-3"
                                }}
                                autoFocus
                              />
                              <div className="max-h-[300px] overflow-y-auto">
                                {employeeServices.length > 0 ? (
                                  employeeServices
                                    .filter(service =>
                                      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
                                    )
                                    .map(service => (
                                      <button
                                        key={service.id}
                                        className={`w-full text-left p-3 hover:bg-[#F5EDEB] transition-colors border-b border-[#E8C7C3]/10 last:border-0 ${bookingForm.serviceId === service.id ? 'bg-[#017172]/5' : ''
                                          }`}
                                        onClick={() => {
                                          console.log('Setting service ID:', service.id);
                                          setBookingForm(prev => ({ ...prev, serviceId: service.id }));
                                          setSearchTerm('');
                                          setIsServicePopoverOpen(false);
                                        }}
                                      >
                                        <div className="font-medium text-[#1E1E1E]">{service.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-[#017172] font-semibold">
                                            {formatPrice(service.price, service.currency)}
                                          </span>
                                          <span className="text-xs text-[#8A8A8A]">
                                            {service.durationMinutes} Min
                                          </span>
                                        </div>
                                        {service.description && (
                                          <div className="text-xs text-[#8A8A8A] mt-1 line-clamp-2">
                                            {service.description}
                                          </div>
                                        )}
                                      </button>
                                    ))
                                ) : (
                                  <div className="p-4 text-center text-[#8A8A8A]">
                                    Keine Services für diese Fachkraft gefunden
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* Step 3: Date */}
                    <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                      <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">3. Datum wählen</p>
                      <Input
                        type="date"
                        value={bookingForm.bookingDate}
                        min={moment().format('YYYY-MM-DD')}
                        max={moment().add(60, 'days').format('YYYY-MM-DD')}
                        onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                        isDisabled={submitting}
                        classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                      />
                    </div>

                    {/* Step 4: Time */}
                    <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                      <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">4. Uhrzeit wählen</p>
                      {loadingSlots ? (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                          <Spinner size="sm" />
                          <span className="text-sm text-[#8A8A8A]">Lade verfügbare Zeiten...</span>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map(slot => (
                            <Button
                              key={slot.startTime}
                              size="sm"
                              className={`${bookingForm.startTime === slot.startTime
                                ? 'bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold'
                                : 'bg-white border border-[#E8C7C3] text-[#1E1E1E] hover:border-[#017172]/40'
                                }`}
                              onPress={() => setBookingForm({ ...bookingForm, startTime: slot.startTime })}
                              isDisabled={submitting}
                            >
                              {slot.startTime}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg text-center text-sm text-[#8A8A8A]">
                          {bookingForm.serviceId ? "Keine verfügbaren Zeiten" : "Bitte zuerst Service und Datum wählen"}
                        </div>
                      )}
                    </div>

                    {/* Step 5: Customer */}
                    <div className="bg-[#F5EDEB] rounded-xl p-4 border border-[#E8C7C3]/20">
                      <p className="font-semibold text-[#1E1E1E] mb-3 text-sm">5. Kundendaten</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Vorname"
                          placeholder="Max"
                          value={bookingForm.firstName}
                          onChange={(e) => setBookingForm({ ...bookingForm, firstName: e.target.value })}
                          isRequired
                          isDisabled={submitting}
                          classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                        />
                        <Input
                          label="Nachname"
                          placeholder="Mustermann"
                          value={bookingForm.lastName}
                          onChange={(e) => setBookingForm({ ...bookingForm, lastName: e.target.value })}
                          isRequired
                          isDisabled={submitting}
                          classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                        />
                        <Input
                          label="E-Mail (optional)"
                          type="email"
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                          isDisabled={submitting}
                          classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                        />
                        <Input
                          label="Telefon (optional)"
                          type="tel"
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                          isDisabled={submitting}
                          classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                        />
                      </div>
                      <div className="mt-3">
                        <Textarea
                          label="Notizen (optional)"
                          value={bookingForm.customerNotes}
                          onChange={(e) => setBookingForm({ ...bookingForm, customerNotes: e.target.value })}
                          isDisabled={submitting}
                          classNames={{ inputWrapper: "bg-white border border-[#E8C7C3]/30" }}
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    {selectedService && (
                      <div className="bg-[#017172]/5 border border-[#017172]/20 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#1E1E1E] text-sm">{selectedService.name}</p>
                          <p className="text-xs text-[#8A8A8A]">
                            {selectedService.durationMinutes} Min
                            {employees.find(e => e.id === selectedEmployeeId)?.name
                              ? ` · ${employees.find(e => e.id === selectedEmployeeId)!.name}`
                              : ''}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-[#017172]">{formatPrice(selectedService.price, selectedService.currency)} </p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  className="bg-white border border-[#E8C7C3]/40 text-[#1E1E1E] font-semibold"
                  onPress={onModalClose}
                  startContent={<X size={14} />}
                  isDisabled={submitting}>
                  {success ? "Schließen" : "Abbrechen"}
                </Button>
                {!success && !createdBooking && (
                  <Button
                    className="bg-gradient-to-r from-[#017172] to-[#015f60] text-white font-semibold shadow-lg shadow-[#017172]/20"
                    onPress={handleCreateManualBooking}
                    isLoading={submitting}
                    isDisabled={!bookingForm.serviceId || !bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.firstName || !bookingForm.lastName}
                    endContent={<ChevronRightIcon size={18} />}>
                    Buchung erstellen
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {confirmDialog}
    </div>
  );
}