"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { 
  Sparkles, Clock, ChevronDown, ChevronUp, Loader2, 
  Search, X, CheckCircle, ArrowRight
} from "lucide-react";
import type { Service, ServiceCategory } from "@/lib/api/booking";
import { getServiceCategories, getServicesByCategory } from "@/lib/api/booking";
import { formatPrice } from "@/lib/utils/currency";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  onNext: () => void;
}

export function ServiceSelector({ services: fallbackServices, selectedService, onSelect, onNext }: ServiceSelectorProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getServiceCategories();
        setCategories(data);
      } catch {
        const defaultCategory: ServiceCategory = {
          id: "default",
          name: "Alle Services",
          description: null,
          displayOrder: 0,
          isActive: true,
          services: fallbackServices,
        };
        setCategories([defaultCategory]);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [fallbackServices]);

  const allServices = useMemo(() => {
    return categories.flatMap((cat) => cat.services);
  }, [categories]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allServices.filter(
      (service) =>
        service.name.toLowerCase().includes(term) ||
        (service.description && service.description.toLowerCase().includes(term))
    );
  }, [allServices, searchTerm]);

  const handleToggleCategory = async (categoryId: string) => {
    if (expandedId === categoryId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(categoryId);
    setShowSearchResults(false);
    setSearchTerm("");
    
    const category = categories.find((c) => c.id === categoryId);
    if (category && category.services.length > 0) return;
    
    setLoadingServices((prev) => ({ ...prev, [categoryId]: true }));
    try {
      const services = await getServicesByCategory(categoryId);
      setCategories((prevCategories) =>
        prevCategories.map((cat) =>
          cat.id === categoryId ? { ...cat, services } : cat
        )
      );
    } catch (error) {
      console.error(`Failed to load services for category ${categoryId}:`, error);
    } finally {
      setLoadingServices((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setShowSearchResults(false);
  };

  const handleSelectService = (service: Service) => {
    onSelect(service);
    setSearchTerm("");
    setShowSearchResults(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#E8C7C3] animate-spin" />
      </div>
    );
  }

  if (allServices.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Sparkles size={40} className="text-[#E8C7C3] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1E1E1E] mb-2">Noch keine Leistungen vorhanden</h2>
        <p className="text-[#8A8A8A] mb-6">Dieser Salon hat noch keine Leistungen eingetragen.</p>
        <a
          href="javascript:history.back()"
          className="inline-block text-sm text-[#017172] underline"
        >
          Zurück zum Profil
        </a>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 px-4 sm:px-0 ${selectedService ? "pb-28" : "pb-4"}`}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">
            Wähle deine Behandlung
          </h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">Schritt 1 von 4</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            placeholder="Behandlungen suchen..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSearchResults(true);
              if (expandedId) setExpandedId(null);
            }}
            startContent={<Search size={18} className="text-[#8A8A8A]" />}
            endContent={
              searchTerm ? (
                <button onClick={clearSearch} className="text-[#8A8A8A] hover:text-[#1E1E1E] transition-colors">
                  <X size={16} />
                </button>
              ) : null
            }
            classNames={{
              inputWrapper: "bg-white border-2 border-[#E8C7C3] hover:border-[#017172] focus-within:border-[#017172]",
              input: "text-[#1E1E1E]",
            }}
          />
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {showSearchResults && searchTerm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {searchResults.length > 0 ? (
                <>
                  <p className="text-sm text-[#8A8A8A]">
                    {searchResults.length} {searchResults.length === 1 ? 'Behandlung' : 'Behandlungen'} gefunden
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {searchResults.map((service) => (
                      <Card
                        key={service.id}
                        isPressable
                        onPress={() => handleSelectService(service)}
                        className={`w-full transition-all ${
                          selectedService?.id === service.id
                            ? "ring-2 ring-[#E8C7C3] ring-offset-2"
                            : "hover:ring-2 hover:ring-[#E8C7C3]/30 hover:ring-offset-1"
                        }`}
                        fullWidth
                      >
                        <CardBody className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 p-2 rounded-xl transition-colors ${
                              selectedService?.id === service.id ? "bg-[#E8C7C3]" : "bg-[#E8C7C3]/10"
                            }`}>
                              <Sparkles className={selectedService?.id === service.id ? "text-white" : "text-[#E8C7C3]"} size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[#1E1E1E] text-sm">{service.name}</h4>
                                  {service.description && (
                                    <p className="text-xs text-[#8A8A8A] mt-0.5 line-clamp-1">{service.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs text-[#8A8A8A]">
                                      <Clock size={12} />
                                      {service.durationMinutes} Min
                                    </span>
                                    <span className="text-xs font-bold text-[#E8C7C3]">
                                      {formatPrice(service.price, service.currency)}
                                    </span>
                                  </div>
                                </div>
                                {selectedService?.id === service.id && (
                                  <CheckCircle size={16} className="text-[#E8C7C3] flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-[#F5EDEB] rounded-xl">
                  <p className="text-sm text-[#8A8A8A]">
                    Keine Behandlungen gefunden für &quot;{searchTerm}&quot;
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories */}
        {(!searchTerm || !showSearchResults) && (
          <div className="space-y-4">
            {categories.map((category) => {
              const isLoading = loadingServices[category.id];
              const isExpanded = expandedId === category.id;

              return (
                <div key={category.id} className="border-2 border-[#E8C7C3] rounded-xl overflow-hidden">
                  <button
                    onClick={() => handleToggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 bg-[#F5EDEB] hover:bg-[#E8C7C3]/20 transition-colors"
                  >
                    <div className="text-left flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-[#1E1E1E] text-sm sm:text-base truncate">{category.name}</h3>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-[#8A8A8A] truncate">{category.description}</p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="flex-shrink-0 text-[#8A8A8A]" />
                    ) : (
                      <ChevronDown size={18} className="flex-shrink-0 text-[#8A8A8A]" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 sm:p-4 space-y-3">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-[#E8C7C3] animate-spin" />
                          <span className="ml-2 text-sm text-[#8A8A8A]">Behandlungen werden geladen...</span>
                        </div>
                      ) : category.services.length === 0 ? (
                        <p className="text-center py-4 text-sm text-[#8A8A8A]">
                          Keine Behandlungen in dieser Kategorie
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2 sm:gap-3">
                          {category.services.map((service) => (
                            <Card
                              key={service.id}
                              isPressable
                              onPress={() => handleSelectService(service)}
                              className={`w-full transition-all ${
                                selectedService?.id === service.id
                                  ? "ring-2 ring-[#E8C7C3] ring-offset-2"
                                  : "hover:ring-2 hover:ring-[#E8C7C3]/30 hover:ring-offset-1"
                              }`}
                              fullWidth
                            >
                              <CardBody className="p-3 sm:p-4 w-full">
                                <div className="flex items-start gap-3 sm:gap-4 w-full">
                                  <div className={`flex-shrink-0 p-2 sm:p-3 rounded-xl transition-colors ${
                                    selectedService?.id === service.id ? "bg-[#E8C7C3]" : "bg-[#E8C7C3]/10"
                                  }`}>
                                    <Sparkles className={selectedService?.id === service.id ? "text-white" : "text-[#E8C7C3]"} size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-[#1E1E1E] text-sm sm:text-base break-words pr-1">
                                          {service.name}
                                        </h4>
                                        {service.description && (
                                          <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1 line-clamp-2 break-words">
                                            {service.description}
                                          </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                          <span className="flex items-center gap-1 text-xs sm:text-sm text-[#8A8A8A] whitespace-nowrap">
                                            <Clock size={14} />
                                            {service.durationMinutes} Min
                                          </span>
                                          <span className="font-bold text-[#E8C7C3] text-sm sm:text-base whitespace-nowrap">
                                            {formatPrice(service.price, service.currency)}
                                          </span>
                                        </div>
                                      </div>
                                      {selectedService?.id === service.id && (
                                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#E8C7C3] rounded-full flex items-center justify-center ml-1">
                                          <CheckCircle size={14} className="text-white" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom bar - Matches EmployeeSelector and DateTimePicker */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t-2 border-[#E8C7C3]/30 shadow-2xl"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              {/* Selected service summary - matches EmployeeSelector style */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-[#E8C7C3] p-2 rounded-lg flex-shrink-0">
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8A8A]">Ausgewählte Behandlung</p>
                  <p className="font-bold text-[#1E1E1E] text-sm truncate">{selectedService.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8A8A8A]">
                      <Clock size={10} className="inline mr-0.5" />
                      {selectedService.durationMinutes} Min
                    </span>
                    <span className="text-xs font-bold text-[#E8C7C3]">
                      {formatPrice(selectedService.price, selectedService.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weiter button - matches EmployeeSelector style */}
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