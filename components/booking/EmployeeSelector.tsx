"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@nextui-org/card";
import { User, Star, Loader2, MapPin, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { getEmployeesByService, type Employee, type Service } from "@/lib/api/booking";

interface EmployeeSelectorProps {
  selectedService: Service | null;
  selectedEmployee: Employee | null;
  onSelect: (employee: Employee) => void;
  onNext: () => void;
  onBack: () => void;
  tenantSlug?: string;
}

export function EmployeeSelector({
  selectedService,
  selectedEmployee,
  onSelect,
  onNext,
  onBack,
  tenantSlug,
}: EmployeeSelectorProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Use useCallback to memoize onSelect to prevent unnecessary re-renders
  const handleSelect = useCallback((employee: Employee) => {
    onSelect(employee);
  }, [onSelect]);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      if (!selectedService?.id) {
        if (isMounted) {
          setError("Kein Service ausgewählt");
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      
      try {
        const data = await getEmployeesByService(selectedService.id, tenantSlug);
        
        if (isMounted) {
          setEmployees(data);
          
          // Auto-select if only one employee and not already auto-selected
          if (data.length === 1 && !hasAutoSelected && !selectedEmployee) {
            setHasAutoSelected(true);
            handleSelect(data[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Fehler beim Laden der Mitarbeiter");
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadEmployees();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [selectedService?.id, handleSelect, hasAutoSelected, selectedEmployee]);

  // Reset auto-select flag when service changes
  useEffect(() => {
    setHasAutoSelected(false);
  }, [selectedService?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[#E8C7C3]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button
          onClick={onBack}
          className="mt-4 text-[#E8C7C3] hover:text-[#D8B0AC] transition-colors"
        >
          Zurück zur Serviceauswahl
        </button>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8A8A8A] mb-4">
          Für diesen Service sind aktuell keine Mitarbeiter verfügbar.
        </p>
        <button
          onClick={onBack}
          className="text-[#E8C7C3] hover:text-[#D8B0AC] transition-colors underline"
        >
          Anderen Service wählen
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 px-4 sm:px-0 ${selectedEmployee ? "pb-28" : "pb-4"}`}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">
            Fachkraft wählen
          </h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">
            Schritt 2 von 4 – Wer soll Ihre Behandlung durchführen?
          </p>
          {selectedService && (
            <p className="text-xs text-[#E8C7C3] mt-1">
              für: {selectedService.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:gap-3">
          {employees.map((emp) => {
            const isSelected = selectedEmployee?.id === emp.id;

            return (
              <Card
                key={emp.id}
                isPressable
                onPress={() => handleSelect(emp)}
                className={`w-full transition-all ${
                  isSelected
                    ? "ring-2 ring-[#E8C7C3] ring-offset-2"
                    : "hover:ring-2 hover:ring-[#E8C7C3]/30 hover:ring-offset-1"
                }`}
                fullWidth
              >
                <CardBody className="p-3 sm:p-4 w-full">
                  <div className="flex items-start gap-3 sm:gap-4 w-full">
                    <div className={`flex-shrink-0 p-2 sm:p-3 rounded-xl transition-colors ${
                      isSelected ? "bg-[#E8C7C3]" : "bg-[#E8C7C3]/10"
                    }`}>
                      <User className={isSelected ? "text-white" : "text-[#E8C7C3]"} size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1E1E1E] text-sm sm:text-base break-words pr-1">
                            {emp.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1 break-words">
                            {emp.role}
                          </p>

                          {emp.location ? (
                            <div className="mt-3 mb-2">
                              <div className="flex items-center gap-2 bg-[#F5EDEB] rounded-lg px-3 py-2 border border-[#E8C7C3]/30">
                                <div className="bg-[#000000] p-1.5 rounded-lg">
                                  <MapPin size={14} className="text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-[#8A8A8A]">Standort</p>
                                  <p className="text-sm font-bold text-[#1E1E1E]">{emp.location}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 mb-2">
                              <div className="flex items-center gap-2 bg-[#F5EDEB]/50 rounded-lg px-3 py-2 border border-[#E8C7C3]/20">
                                <div className="bg-[#6b7280] p-1.5 rounded-lg">
                                  <MapPin size={14} className="text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-[#8A8A8A]">Standort</p>
                                  <p className="text-sm text-[#8A8A8A]">Auf Anfrage</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {emp.specialty && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className={`flex items-center gap-1 text-xs sm:text-sm rounded-xl px-2 py-1 transition-colors ${
                                isSelected ? "bg-[#E8C7C3]/10 text-[#E8C7C3]" : "bg-[#F5EDEB] text-[#8A8A8A]"
                              }`}>
                                <Star size={13} className={isSelected ? "fill-[#E8C7C3]" : ""} />
                                <span className="truncate">{emp.specialty}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#E8C7C3] rounded-full flex items-center justify-center ml-1">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

      </div>

      {/* Sticky bottom bar */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t-2 border-[#E8C7C3]/30 shadow-2xl"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              {/* Back button */}
              <button
                onClick={onBack}
                className="flex-shrink-0 flex items-center gap-1 bg-[#F5EDEB] hover:bg-[#ede0dd] active:scale-95 text-[#1E1E1E] font-semibold py-3 px-4 rounded-xl transition-all"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Zurück</span>
              </button>

              {/* Selected employee summary */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8A8A]">Ausgewählt</p>
                  <p className="font-bold text-[#1E1E1E] text-sm truncate">{selectedEmployee.name}</p>
                  <p className="text-xs text-[#8A8A8A] truncate">{selectedEmployee.role}</p>
                </div>
              </div>

              {/* Weiter button */}
              <button
                onClick={onNext}
                className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] hover:from-[#D8B0AC] hover:to-[#c49590] active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
              >
                Weiter
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}