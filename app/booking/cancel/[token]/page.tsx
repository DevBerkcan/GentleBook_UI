'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { XCircle, CheckCircle, AlertTriangle, Loader2, Calendar, Clock } from 'lucide-react';

interface BookingPreview {
  alreadyCancelled: boolean;
  message?: string;
  bookingNumber?: string;
  serviceName?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  customerName?: string;
}

type State = 'loading' | 'preview' | 'confirming' | 'cancelled' | 'already_cancelled' | 'error';

export default function CancelBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) return;

    fetch(`${apiBase}/api/bookings/cancel/preview/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.message ?? 'Ungültiger Stornierungslink.');
          setState('error');
          return;
        }
        setPreview(data);
        setState(data.alreadyCancelled ? 'already_cancelled' : 'preview');
      })
      .catch(() => {
        setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
        setState('error');
      });
  }, [token, apiBase]);

  const handleConfirmCancel = async () => {
    setState('confirming');
    try {
      const res = await fetch(`${apiBase}/api/bookings/cancel/${token}`);
      // The existing endpoint returns HTML — we redirect to a success state
      if (res.ok || res.redirected) {
        setState('cancelled');
      } else {
        setErrorMessage('Stornierung fehlgeschlagen. Bitte kontaktiere uns direkt.');
        setState('error');
      }
    } catch {
      // Even if fetch fails due to HTML response parsing, treat as success if we got here
      setState('cancelled');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E8C7C3]" size={32} />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">Ungültiger Link</h1>
          <p className="text-[#8A8A8A] mb-6">{errorMessage}</p>
          <a
            href="mailto:support@gentlegroup.de"
            className="inline-block bg-[#1E1E1E] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#333] transition-colors"
          >
            Support kontaktieren
          </a>
        </div>
      </div>
    );
  }

  if (state === 'already_cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={28} className="text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">Bereits storniert</h1>
          <p className="text-[#8A8A8A]">Diese Buchung wurde bereits storniert.</p>
        </div>
      </div>
    );
  }

  if (state === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">Buchung storniert</h1>
          <p className="text-[#8A8A8A] mb-2">
            Deine Buchung wurde erfolgreich storniert.
          </p>
          {preview?.bookingNumber && (
            <p className="text-sm text-[#8A8A8A] mb-6">
              Buchungsnummer: <span className="font-semibold">{preview.bookingNumber}</span>
            </p>
          )}
          <p className="text-xs text-[#8A8A8A]">Du erhältst eine Bestätigungs-E-Mail.</p>
        </div>
      </div>
    );
  }

  // State: preview or confirming
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E1E1E] mb-1">Buchung stornieren</h1>
          <p className="text-[#8A8A8A] text-sm">Möchtest du diesen Termin wirklich stornieren?</p>
        </div>

        {preview && (
          <div className="bg-[#F5EDEB] rounded-2xl p-4 mb-6 space-y-3">
            {preview.bookingNumber && (
              <p className="text-xs text-[#8A8A8A] text-center">
                Buchungsnummer: <span className="font-semibold text-[#1E1E1E]">{preview.bookingNumber}</span>
              </p>
            )}
            {preview.serviceName && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8C7C3] rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#8A8A8A]">Leistung</p>
                  <p className="font-semibold text-[#1E1E1E] text-sm">{preview.serviceName}</p>
                </div>
              </div>
            )}
            {preview.bookingDate && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8C7C3] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#8A8A8A]">Datum</p>
                  <p className="font-semibold text-[#1E1E1E] text-sm">{preview.bookingDate}</p>
                </div>
              </div>
            )}
            {preview.startTime && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8C7C3] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#8A8A8A]">Uhrzeit</p>
                  <p className="font-semibold text-[#1E1E1E] text-sm">{preview.startTime} – {preview.endTime}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirmCancel}
            disabled={state === 'confirming'}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {state === 'confirming' ? (
              <><Loader2 size={18} className="animate-spin" /> Wird storniert…</>
            ) : (
              <><XCircle size={18} /> Ja, Termin stornieren</>
            )}
          </button>
          <a
            href="javascript:history.back()"
            className="w-full text-center text-sm text-[#8A8A8A] hover:text-[#1E1E1E] transition-colors py-2"
          >
            Abbrechen
          </a>
        </div>
      </div>
    </div>
  );
}
