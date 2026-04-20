// app/meine-buchungen/page.tsx
"use client";

import { useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import { Calendar, Mail, AlertCircle, X } from "lucide-react";
import { getBookingsByEmail, cancelBooking, type BookingResponse } from "@/lib/api/booking";

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await getBookingsByEmail(email);
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCancelModal(booking: BookingResponse) {
    setSelectedBooking(booking);
    onOpen();
  }

  async function handleCancel() {
    if (!selectedBooking) return;

    setCancelling(true);
    try {
      await cancelBooking(selectedBooking.id);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: "Cancelled" } : b
        )
      );
      onClose();
    } catch (err: any) {
      alert("Fehler beim Stornieren: " + err.message);
    } finally {
      setCancelling(false);
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

  const canCancel = (booking: BookingResponse) => {
    return booking.status === "Pending" || booking.status === "Confirmed";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1E1E1E] mb-3">Meine Buchungen</h1>
          <p className="text-[#8A8A8A]">
            Gib deine E-Mail-Adresse ein, um deine Termine zu sehen
          </p>
        </div>

        <Card className="mb-8 border-2 border-[#E8C7C3]/20 shadow-xl">
          <CardBody className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                type="email"
                placeholder="deine-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startContent={<Mail size={18} className="text-[#8A8A8A]" />}
                isRequired
                classNames={{
                  input: "text-[#1E1E1E]",
                  inputWrapper: "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
                }}
                size="lg"
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white font-semibold px-8 shadow-lg"
                size="lg"
                isLoading={loading}
              >
                Suchen
              </Button>
            </form>
          </CardBody>
        </Card>

        {error && (
          <Card className="mb-6 border-2 border-red-200 shadow-xl">
            <CardBody className="p-6 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                <div>
                  <div className="font-semibold text-red-900 mb-1">Fehler</div>
                  <div className="text-red-700">{error}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {searched && !loading && (
          <>
            {bookings.length === 0 ? (
              <Card className="border-2 border-[#E8C7C3]/20 shadow-xl">
                <CardBody className="p-12 text-center">
                  <Calendar className="mx-auto mb-4 text-[#E8C7C3]" size={48} />
                  <h3 className="text-xl font-semibold text-[#1E1E1E] mb-2">
                    Keine Buchungen gefunden
                  </h3>
                  <p className="text-[#8A8A8A]">
                    Für diese E-Mail-Adresse wurden keine Termine gefunden.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[#1E1E1E]">
                    Deine Termine ({bookings.length})
                  </h2>
                </div>

                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-2 border-[#E8C7C3]/20 shadow-xl">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-[#1E1E1E]">
                              {booking.booking.serviceName}
                            </h3>
                            <Chip color={getStatusColor(booking.status)} size="sm" variant="flat">
                              {getStatusLabel(booking.status)}
                            </Chip>
                          </div>
                          <div className="text-sm text-[#8A8A8A]">
                            Buchungsnummer: {booking.bookingNumber}
                          </div>
                        </div>

                        {canCancel(booking) && (
                          <Button
                            color="danger"
                            variant="flat"
                            size="sm"
                            startContent={<X size={16} />}
                            onPress={() => openCancelModal(booking)}
                            className="bg-[#D8B0AC]/20 text-[#1E1E1E] hover:bg-[#D8B0AC] hover:text-white"
                          >
                            Stornieren
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F5EDEB] p-4 rounded-lg border border-[#E8C7C3]/30">
                        <div>
                          <div className="text-sm text-[#8A8A8A] mb-1">Datum</div>
                          <div className="font-semibold text-[#1E1E1E]">
                            {new Date(booking.booking.bookingDate).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-[#8A8A8A] mb-1">Uhrzeit</div>
                          <div className="font-semibold text-[#1E1E1E]">
                            {booking.booking.startTime} - {booking.booking.endTime} Uhr
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-[#8A8A8A] mb-1">Preis</div>
                          <div className="font-semibold text-[#E8C7C3]">
                            ab {booking.booking.price.toFixed(2)} {booking.booking.currency ?? 'CHF'}
                          </div>
                        </div>
                      </div>

                      {booking.confirmationSent && (
                        <div className="mt-4 text-sm text-[#C09995] bg-[#F5EDEB] p-3 rounded-lg border border-[#C09995]/30">
                          📧 Bestätigungsemail wurde an {booking.customer.email} gesendet
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md" className="bg-white">
        <ModalContent>
          <ModalHeader className="text-2xl font-bold text-[#1E1E1E] border-b border-[#E8C7C3]/20">
            Termin stornieren
          </ModalHeader>
          <ModalBody className="py-6">
            {selectedBooking && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                  <div>
                    <div className="font-semibold text-yellow-900 mb-1">
                      Möchtest du diesen Termin wirklich stornieren?
                    </div>
                    <div className="text-sm text-yellow-800">
                      Diese Aktion kann nicht rückgängig gemacht werden.
                    </div>
                  </div>
                </div>

                <div className="bg-[#F5EDEB] p-4 rounded-lg border border-[#E8C7C3]/30">
                  <div className="font-semibold text-[#1E1E1E] mb-2">
                    {selectedBooking.booking.serviceName}
                  </div>
                  <div className="text-sm text-[#8A8A8A]">
                    {new Date(selectedBooking.booking.bookingDate).toLocaleDateString('de-DE')} •{' '}
                    {selectedBooking.booking.startTime} - {selectedBooking.booking.endTime}
                  </div>
                  <div className="text-sm text-[#8A8A8A] mt-2">
                    Buchungsnummer: {selectedBooking.bookingNumber}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="border-t border-[#E8C7C3]/20">
            <Button 
              color="default" 
              variant="light" 
              onPress={onClose}
              className="text-[#8A8A8A]"
            >
              Abbrechen
            </Button>
            <Button
              color="danger"
              onPress={handleCancel}
              isLoading={cancelling}
              className="bg-gradient-to-r from-[#D8B0AC] to-[#C09995] text-white"
            >
              Termin stornieren
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}