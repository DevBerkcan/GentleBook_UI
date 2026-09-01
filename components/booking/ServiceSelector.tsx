"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import {
  Sparkles, Clock, ChevronDown, ChevronUp, Loader2,
  Search, X, CheckCircle, ArrowRight, MapPin
} from "lucide-react";
import type { Service, ServiceCategory } from "@/lib/api/booking";
import { getServiceCategories, getServicesByCategory } from "@/lib/api/booking";
import { formatPrice } from "@/lib/utils/currency";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  onNext: () => void;
  tenantSlug?: string;
  primaryColor?: string;
}

function lighten(hex: string, amount = 0.85) {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return "#F6F5FA"; }
}

export function ServiceSelector({ services: fallbackServices, selectedService, onSelect, onNext, tenantSlug, primaryColor = "#6355E4" }: ServiceSelectorProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const lightBg   = lighten(primaryColor, 0.90);
  const veryLight = lighten(primaryColor, 0.94);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getServiceCategories(tenantSlug);
        if (data.length > 0) {
          setCategories(data);
          return;
        }
        throw new Error("No categories returned");
      } catch {
        const defaultCategory: ServiceCategory = {
          id: "default",
          name: "",
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
  }, [fallbackServices, tenantSlug]);

  const allServices = useMemo(() => categories.flatMap((cat) => cat.services), [categories]);

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
    if (expandedId === categoryId) { setExpandedId(null); return; }
    setExpandedId(categoryId);
    setShowSearchResults(false);
    setSearchTerm("");
    const category = categories.find((c) => c.id === categoryId);
    if (category && category.services.length > 0) return;
    setLoadingServices((prev) => ({ ...prev, [categoryId]: true }));
    try {
      const services = await getServicesByCategory(categoryId, tenantSlug);
      setCategories((prevCategories) =>
        prevCategories.map((cat) => cat.id === categoryId ? { ...cat, services } : cat)
      );
    } catch {
      // silent
    } finally {
      setLoadingServices((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const clearSearch = () => { setSearchTerm(""); setShowSearchResults(false); };
  const handleSelectService = (service: Service) => { onSelect(service); setSearchTerm(""); setShowSearchResults(false); };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (allServices.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Sparkles size={40} className="mx-auto mb-4" style={{ color: primaryColor }} />
        <h2 className="text-xl font-bold text-[#14162B] mb-2">{t.booking.noServicesTitle}</h2>
        <p className="text-[#8A8A8A] mb-6">{t.booking.noServicesDesc}</p>
        <a href="javascript:history.back()" className="inline-block text-sm text-[#17A398] underline">
          {t.booking.backToProfile}
        </a>
      </div>
    );
  }

  const ServiceCard = ({ service }: { service: Service }) => {
    const isSelected = selectedService?.id === service.id;
    return (
      <Card
        key={service.id}
        isPressable
        onPress={() => handleSelectService(service)}
        className="w-full transition-all"
        style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${primaryColor}` } : undefined}
        fullWidth
      >
        <CardBody className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 p-2 rounded-xl transition-colors"
              style={{ backgroundColor: isSelected ? primaryColor : `${primaryColor}1A` }}
            >
              <Sparkles className={isSelected ? "text-white" : ""} size={18} style={!isSelected ? { color: primaryColor } : {}} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#14162B] text-sm">{service.name}</h4>
                  {service.description && (
                    <p className="text-xs text-[#8A8A8A] mt-0.5 line-clamp-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-[#8A8A8A]">
                      <Clock size={12} />
                      {service.durationMinutes} {t.booking.minutes}
                    </span>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>
                      {formatPrice(service.price, service.currency)}
                    </span>
                  </div>
                  {service.locationName && (
                    <span className="mt-1.5 flex items-center gap-1 text-xs text-[#6B7280]">
                      <MapPin size={11} /> {service.locationName}
                    </span>
                  )}
                </div>
                {isSelected && <CheckCircle size={16} className="flex-shrink-0" style={{ color: primaryColor }} />}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const ServiceCardLarge = ({ service }: { service: Service }) => {
    const isSelected = selectedService?.id === service.id;
    return (
      <Card
        key={service.id}
        isPressable
        onPress={() => handleSelectService(service)}
        className="w-full transition-all"
        style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${primaryColor}` } : undefined}
        fullWidth
      >
        <CardBody className="p-3 sm:p-4 w-full">
          <div className="flex items-start gap-3 sm:gap-4 w-full">
            <div
              className="flex-shrink-0 p-2 sm:p-3 rounded-xl transition-colors"
              style={{ backgroundColor: isSelected ? primaryColor : `${primaryColor}1A` }}
            >
              <Sparkles className={isSelected ? "text-white" : ""} size={20} style={!isSelected ? { color: primaryColor } : {}} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#14162B] text-sm sm:text-base break-words pr-1">{service.name}</h4>
                  {service.description && (
                    <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1 line-clamp-2 break-words">{service.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-[#8A8A8A] whitespace-nowrap">
                      <Clock size={14} />
                      {service.durationMinutes} {t.booking.minutes}
                    </span>
                    <span className="font-bold text-sm sm:text-base whitespace-nowrap" style={{ color: primaryColor }}>
                      {formatPrice(service.price, service.currency)}
                    </span>
                  </div>
                  {service.locationName && (
                    <span className="mt-2 flex items-center gap-1 text-xs text-[#6B7280]">
                      <MapPin size={11} /> {service.locationName}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ml-1" style={{ backgroundColor: primaryColor }}>
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      <div className={`space-y-6 px-4 sm:px-0 ${selectedService ? "pb-28" : "pb-4"}`}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#14162B] mb-2">{t.booking.chooseService}</h2>
          <p className="text-sm sm:text-base text-[#8A8A8A]">{t.booking.step1of4}</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            placeholder={t.booking.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSearchResults(true);
              if (expandedId) setExpandedId(null);
            }}
            startContent={<Search size={18} className="text-[#8A8A8A]" />}
            endContent={
              searchTerm ? (
                <button onClick={clearSearch} className="text-[#8A8A8A] hover:text-[#14162B] transition-colors">
                  <X size={16} />
                </button>
              ) : null
            }
            classNames={{
              inputWrapper: "bg-white border-2",
              input: "text-[#14162B]",
            }}
            style={{ borderColor: primaryColor } as any}
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
                    {searchResults.length} {searchResults.length === 1 ? t.booking.servicesFound_one : t.booking.servicesFound_other}
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {searchResults.map((service) => <ServiceCard key={service.id} service={service} />)}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 rounded-xl" style={{ backgroundColor: lightBg }}>
                  <p className="text-sm text-[#8A8A8A]">{t.booking.noSearchResults} &quot;{searchTerm}&quot;</p>
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
                <div key={category.id} className="rounded-xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>
                  <button
                    onClick={() => handleToggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 transition-colors"
                    style={{ backgroundColor: isExpanded ? `${primaryColor}22` : lightBg }}
                  >
                    <div className="text-left flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-[#14162B] text-sm sm:text-base truncate">
                        {category.id === "default" ? t.booking.allServices : category.name}
                      </h3>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-[#8A8A8A] truncate">{category.description}</p>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="flex-shrink-0 text-[#8A8A8A]" /> : <ChevronDown size={18} className="flex-shrink-0 text-[#8A8A8A]" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 sm:p-4 space-y-3">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                          <span className="ml-2 text-sm text-[#8A8A8A]">{t.booking.loadingServices}</span>
                        </div>
                      ) : category.services.length === 0 ? (
                        <p className="text-center py-4 text-sm text-[#8A8A8A]">{t.booking.noServicesInCategory}</p>
                      ) : (
                        <div className="flex flex-col gap-2 sm:gap-3">
                          {category.services.map((service) => <ServiceCardLarge key={service.id} service={service} />)}
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

      {/* Sticky bottom bar */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm shadow-2xl"
            style={{ borderTop: `2px solid ${primaryColor}4D` }}
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8A8A]">{t.booking.selectedTreatment}</p>
                  <p className="font-bold text-[#14162B] text-sm truncate">{selectedService.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8A8A8A]">
                      <Clock size={10} className="inline mr-0.5" />
                      {selectedService.durationMinutes} {t.booking.minutes}
                    </span>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>
                      {formatPrice(selectedService.price, selectedService.currency)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onNext}
                className="flex-shrink-0 flex items-center gap-2 active:scale-95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${lighten(primaryColor, 0.2)})` }}
              >
                {t.next}
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
