export type Lang = "de" | "en";

export const translations = {
  de: {
    // Common
    back: "Zurück",
    next: "Weiter",
    save: "Speichern",
    cancel: "Abbrechen",
    loading: "Wird geladen...",
    error: "Fehler",
    close: "Schließen",
    yes: "Ja",
    no: "Nein",

    // Booking page
    booking: {
      onlineBooking: "Online-Buchung",
      stepLabels: ["Service", "Fachkraft", "Datum & Zeit", "Kontakt"],
      // Step 1 - Service
      chooseService: "Wähle deine Behandlung",
      step1of4: "Schritt 1 von 4",
      noServicesTitle: "Noch keine Leistungen vorhanden",
      noServicesDesc: "Dieser Salon hat noch keine Leistungen eingetragen.",
      backToProfile: "Zurück zum Profil",
      searchPlaceholder: "Behandlungen suchen...",
      servicesFound_one: "Behandlung gefunden",
      servicesFound_other: "Behandlungen gefunden",
      noSearchResults: "Keine Behandlungen gefunden für",
      loadingServices: "Behandlungen werden geladen...",
      noServicesInCategory: "Keine Behandlungen in dieser Kategorie",
      allServices: "Alle Services",
      selectedTreatment: "Ausgewählte Behandlung",
      minutes: "Min",
      // Step 2 - Employee
      chooseEmployee: "Fachkraft wählen",
      step2of4: "Schritt 2 von 4 – Wer soll Ihre Behandlung durchführen?",
      for: "für",
      noEmployeesAvailable: "Für diesen Service sind aktuell keine Mitarbeiter verfügbar.",
      chooseOtherService: "Anderen Service wählen",
      backToServices: "Zurück zur Serviceauswahl",
      errorLoadingEmployees: "Fehler beim Laden der Mitarbeiter",
      noServiceSelected: "Kein Service ausgewählt",
      location: "Standort",
      locationOnRequest: "Auf Anfrage",
      selected: "Ausgewählt",
      // Step 3 - DateTime
      chooseDatetime: "Datum & Uhrzeit wählen",
      step3of4: "Schritt 3 von 4",
      noEmployeeSelected: "Bitte wählen Sie zuerst eine Fachkraft aus.",
      availableTimesOn: "Verfügbare Zeiten am",
      noTimesAvailable: "Keine verfügbaren Termine an diesem Tag",
      // Step 4 - Contact
      contactData: "Kontaktdaten",
      step4of4: "Schritt 4 von 4 – Geben Sie Ihre Kontaktdaten ein",
      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      phone: "Telefon",
      treatmentLabel: "Behandlung",
      dateTime: "Datum & Zeit",
      specialist: "Fachkraft",
      totalAmount: "Gesamtbetrag",
      inclVat: "Inkl. MwSt. • Zahlung vor Ort",
      privacy: "Ich habe die",
      privacyLink: "Datenschutzhinweise",
      privacyAnd: "gelesen und stimme diesen zu.",
      bookAppointment: "Termin buchen",
      booking: "Wird gebucht...",
      errorFixFields: "Bitte korrigieren Sie folgende Fehler:",
      errorFillAll: "Bitte alle Pflichtfelder ausfüllen und Datenschutz akzeptieren",
      acceptPrivacy: "Bitte akzeptieren Sie die Datenschutzhinweise",
      // Validation
      firstNameRequired: "Vorname ist erforderlich",
      firstNameMinLength: "Mindestens 2 Zeichen",
      lastNameRequired: "Nachname ist erforderlich",
      lastNameMinLength: "Mindestens 2 Zeichen",
      emailRequired: "E-Mail ist erforderlich",
      emailInvalid: "Ungültige E-Mail",
      phoneRequired: "Telefon ist erforderlich",
      phoneMinLength: "Mindestens 10 Ziffern",
      // Errors
      errorLoadServices: "Fehler beim Laden der Services",
      errorLoadAvailability: "Fehler beim Laden der Verfügbarkeit",
      errorFillRequired: "Bitte alle Felder ausfüllen",
      errorPrivacy: "Bitte stimmen Sie den Datenschutzbestimmungen zu",
      errorFillAllRequired: "Bitte füllen Sie alle Pflichtfelder aus.",
      errorInvalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      errorBooking: "Fehler beim Buchen. Bitte versuchen Sie es erneut.",
      bookingSystemNotFound: "Buchungssystem nicht gefunden",
      bookingSystemNotFoundDesc: "Der Link",
      bookingSystemNotFoundDesc2: "ist nicht gültig.",
      unavailableTitle: "Derzeit nicht verfügbar",
      unavailableDesc: "Über diese Seite können momentan keine Termine gebucht werden. Bitte wenden Sie sich direkt an das Unternehmen.",
      locationStep: "Standort",
      chooseLocation: "Standort wählen",
      stepOf: "Schritt {current} von {total}",
      finderTitle: "Neu: Automatisierter Service-Finder",
      finderDesc: "Lassen Sie sich zuerst passende Services empfehlen und buchen Sie danach direkt.",
      finderStart: "Finder starten",
      waitlistOpen: "Keine passende Uhrzeit? Zur Warteliste",
      waitlistFirstLastRequired: "Vor- und Nachname sind erforderlich.",
      waitlistPreferredTimeRequired: "Bitte wählen Sie eine Wunschzeit.",
      waitlistError: "Fehler beim Eintragen in die Warteliste.",
      waitlistSuccessTitle: "Sie stehen auf der Warteliste!",
      waitlistSuccessDesc: "Wird ein passender Termin frei, reservieren wir ihn 15 Minuten für Sie und senden Ihnen einen persönlichen Link.",
      waitlistFor: "Warteliste für",
      waitlistAt: "bei",
      waitlistAnyTime: "Beliebige Uhrzeit",
      waitlistExactTime: "Bestimmte Uhrzeit",
      waitlistPreferredTime: "Wunschzeit",
      waitlistOtherEmployees: "Auch bei anderen passenden Mitarbeitern benachrichtigen",
      notesOptional: "Anmerkungen (optional)",
      waitlistSubmitting: "Wird eingetragen…",
      waitlistSubmit: "Auf Warteliste setzen",
    },

    // Admin
    admin: {
      dashboard: "Dashboard",
      calendar: "Kalender",
      bookings: "Buchungen",
      customers: "Kunden",
      services: "Services",
      employees: "Mitarbeiter",
      absences: "Abwesenheiten",
      tracking: "Tracking",
      myLinks: "Meine Links",
      settings: "Einstellungen",
      subscription: "Abonnement",
      logout: "Abmelden",
      overview: "Übersicht",
      teamAndServices: "Team & Services",
      analytics: "Analytics",
      administration: "Administration",
      // Common actions
      new: "Neu",
      edit: "Bearbeiten",
      delete: "Löschen",
      search: "Suchen",
      filter: "Filter",
      export: "Export",
      import: "Import",
      active: "Aktiv",
      inactive: "Inaktiv",
      status: "Status",
      name: "Name",
      email: "E-Mail",
      phone: "Telefon",
      date: "Datum",
      time: "Uhrzeit",
      price: "Preis",
      duration: "Dauer",
      description: "Beschreibung",
      actions: "Aktionen",
      confirmDelete: "Wirklich löschen?",
      noDataFound: "Keine Daten gefunden",
      // Subscription
      trialExpired: "Testzeitraum abgelaufen",
      trialExpiredDesc: "Es gibt keine automatische Abbuchung. Wählen Sie aktiv einen Monats- oder Jahrestarif, um GentleBook weiter zu nutzen.",
      requestSent: "Anfrage gesendet!",
      planActivatedIn24h: "Ihr Plan wird innerhalb von 24h aktiviert. Sie erhalten eine Bestätigungs-E-Mail.",
      subscriptionDetails: "Abonnement-Details",
      upgradeNow: "Jetzt upgraden",
      recommended: "Empfohlen",
      perMonth: "/Monat",
      request: "Anfragen →",
      // Onboarding
      setupWizard: "Richten Sie Ihr Studio in wenigen Schritten ein",
      startSetup: "Setup-Wizard starten",
      // Employee portal
      myArea: "Mein Bereich",
      myCalendar: "Mein Kalender",
      noteToAdmin: "Notiz an Admin",
      inbox: "Eingang",
      inboxTitle: "Mitarbeiter-Nachrichten",
      unreadNotes: "Ungelesen",
      noteSubject: "Betreff",
      noteMessage: "Nachricht",
      noteSend: "Notiz senden",
      noteSending: "Wird gesendet...",
      noteSent: "Notiz gesendet!",
      noteSentDesc: "Ihre Nachricht wurde an den Admin gesendet.",
      noteNew: "Neue Notiz",
      noteHistory: "Gesendete Notizen",
      noteSubjectPlaceholder: "Worum geht es?",
      noteMessagePlaceholder: "Ihre Nachricht an den Admin...",
      noteRead: "Gelesen",
      noteUnread: "Ungelesen",
      noteFrom: "Von",
      noteMarkRead: "Als gelesen markieren",
      noteNoMessages: "Noch keine Nachrichten",
      noteNoMessagesDesc: "Mitarbeiter können Ihnen hier Nachrichten senden.",
      noteNoSent: "Noch keine gesendeten Notizen",
      noteNoSentDesc: "Senden Sie Ihre erste Notiz an den Admin.",
      subjectOptions: ["Allgemeines", "Urlaub anfragen", "Termin-Feedback", "Frage", "Sonstiges"],
    },
  },

  en: {
    // Common
    back: "Back",
    next: "Next",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    error: "Error",
    close: "Close",
    yes: "Yes",
    no: "No",

    // Booking page
    booking: {
      onlineBooking: "Online Booking",
      stepLabels: ["Service", "Specialist", "Date & Time", "Contact"],
      // Step 1 - Service
      chooseService: "Choose your treatment",
      step1of4: "Step 1 of 4",
      noServicesTitle: "No services available yet",
      noServicesDesc: "This salon hasn't added any services yet.",
      backToProfile: "Back to profile",
      searchPlaceholder: "Search treatments...",
      servicesFound_one: "treatment found",
      servicesFound_other: "treatments found",
      noSearchResults: "No treatments found for",
      loadingServices: "Loading treatments...",
      noServicesInCategory: "No treatments in this category",
      allServices: "All services",
      selectedTreatment: "Selected treatment",
      minutes: "min",
      // Step 2 - Employee
      chooseEmployee: "Choose a specialist",
      step2of4: "Step 2 of 4 – Who should perform your treatment?",
      for: "for",
      noEmployeesAvailable: "No staff currently available for this service.",
      chooseOtherService: "Choose another service",
      backToServices: "Back to service selection",
      errorLoadingEmployees: "Error loading staff",
      noServiceSelected: "No service selected",
      location: "Location",
      locationOnRequest: "On request",
      selected: "Selected",
      // Step 3 - DateTime
      chooseDatetime: "Choose date & time",
      step3of4: "Step 3 of 4",
      noEmployeeSelected: "Please select a specialist first.",
      availableTimesOn: "Available times on",
      noTimesAvailable: "No available appointments on this day",
      // Step 4 - Contact
      contactData: "Contact details",
      step4of4: "Step 4 of 4 – Enter your contact information",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone",
      treatmentLabel: "Treatment",
      dateTime: "Date & Time",
      specialist: "Specialist",
      totalAmount: "Total",
      inclVat: "Incl. VAT • Payment on site",
      privacy: "I have read the",
      privacyLink: "privacy policy",
      privacyAnd: "and agree to it.",
      bookAppointment: "Book appointment",
      booking: "Booking...",
      errorFixFields: "Please fix the following errors:",
      errorFillAll: "Please fill in all required fields and accept the privacy policy",
      acceptPrivacy: "Please accept the privacy policy",
      // Validation
      firstNameRequired: "First name is required",
      firstNameMinLength: "At least 2 characters",
      lastNameRequired: "Last name is required",
      lastNameMinLength: "At least 2 characters",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email",
      phoneRequired: "Phone is required",
      phoneMinLength: "At least 10 digits",
      // Errors
      errorLoadServices: "Error loading services",
      errorLoadAvailability: "Error loading availability",
      errorFillRequired: "Please fill in all fields",
      errorPrivacy: "Please agree to the privacy policy",
      errorFillAllRequired: "Please fill in all required fields.",
      errorInvalidEmail: "Please enter a valid email address.",
      errorBooking: "Booking failed. Please try again.",
      bookingSystemNotFound: "Booking system not found",
      bookingSystemNotFoundDesc: "The link",
      bookingSystemNotFoundDesc2: "is not valid.",
      unavailableTitle: "Currently unavailable",
      unavailableDesc: "Appointments cannot currently be booked through this page. Please contact the business directly.",
      locationStep: "Location",
      chooseLocation: "Choose a location",
      stepOf: "Step {current} of {total}",
      finderTitle: "New: Automated service finder",
      finderDesc: "Get suitable service recommendations first, then book directly.",
      finderStart: "Start finder",
      waitlistOpen: "No suitable time? Join the waitlist",
      waitlistFirstLastRequired: "First and last name are required.",
      waitlistPreferredTimeRequired: "Please select a preferred time.",
      waitlistError: "Could not join the waitlist.",
      waitlistSuccessTitle: "You're on the waitlist!",
      waitlistSuccessDesc: "When a suitable appointment becomes available, we will reserve it for you for 15 minutes and send you a personal link.",
      waitlistFor: "Waitlist for",
      waitlistAt: "with",
      waitlistAnyTime: "Any time",
      waitlistExactTime: "Specific time",
      waitlistPreferredTime: "Preferred time",
      waitlistOtherEmployees: "Notify me about other suitable staff members too",
      notesOptional: "Notes (optional)",
      waitlistSubmitting: "Joining…",
      waitlistSubmit: "Join waitlist",
    },

    // Admin
    admin: {
      dashboard: "Dashboard",
      calendar: "Calendar",
      bookings: "Bookings",
      customers: "Customers",
      services: "Services",
      employees: "Staff",
      absences: "Absences",
      tracking: "Tracking",
      myLinks: "My Links",
      settings: "Settings",
      subscription: "Subscription",
      logout: "Log out",
      overview: "Overview",
      teamAndServices: "Team & Services",
      analytics: "Analytics",
      administration: "Administration",
      // Common actions
      new: "New",
      edit: "Edit",
      delete: "Delete",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      active: "Active",
      inactive: "Inactive",
      status: "Status",
      name: "Name",
      email: "Email",
      phone: "Phone",
      date: "Date",
      time: "Time",
      price: "Price",
      duration: "Duration",
      description: "Description",
      actions: "Actions",
      confirmDelete: "Really delete?",
      noDataFound: "No data found",
      // Subscription
      trialExpired: "Trial period expired",
      trialExpiredDesc: "There is no automatic charge. Actively choose a monthly or annual plan to continue using GentleBook.",
      requestSent: "Request sent!",
      planActivatedIn24h: "Your plan will be activated within 24h. You'll receive a confirmation email.",
      subscriptionDetails: "Subscription details",
      upgradeNow: "Upgrade now",
      recommended: "Recommended",
      perMonth: "/month",
      request: "Request →",
      // Onboarding
      setupWizard: "Set up your studio in a few steps",
      startSetup: "Start setup wizard",
      // Employee portal
      myArea: "My Area",
      myCalendar: "My Calendar",
      noteToAdmin: "Note to Admin",
      inbox: "Inbox",
      inboxTitle: "Staff Messages",
      unreadNotes: "Unread",
      noteSubject: "Subject",
      noteMessage: "Message",
      noteSend: "Send note",
      noteSending: "Sending...",
      noteSent: "Note sent!",
      noteSentDesc: "Your message has been sent to the admin.",
      noteNew: "New note",
      noteHistory: "Sent notes",
      noteSubjectPlaceholder: "What is this about?",
      noteMessagePlaceholder: "Your message to the admin...",
      noteRead: "Read",
      noteUnread: "Unread",
      noteFrom: "From",
      noteMarkRead: "Mark as read",
      noteNoMessages: "No messages yet",
      noteNoMessagesDesc: "Staff can send you messages here.",
      noteNoSent: "No sent notes yet",
      noteNoSentDesc: "Send your first note to the admin.",
      subjectOptions: ["General", "Request leave", "Appointment feedback", "Question", "Other"],
    },
  },
} as const;

export type Translations = {
  back: string; next: string; save: string; cancel: string;
  loading: string; error: string; close: string; yes: string; no: string;
  booking: {
    onlineBooking: string; stepLabels: readonly string[];
    chooseService: string; step1of4: string;
    noServicesTitle: string; noServicesDesc: string; backToProfile: string;
    searchPlaceholder: string; servicesFound_one: string; servicesFound_other: string;
    noSearchResults: string; loadingServices: string; noServicesInCategory: string;
    allServices: string;
    selectedTreatment: string; minutes: string;
    chooseEmployee: string; step2of4: string; for: string;
    noEmployeesAvailable: string; chooseOtherService: string; backToServices: string;
    errorLoadingEmployees: string; noServiceSelected: string;
    location: string; locationOnRequest: string; selected: string;
    chooseDatetime: string; step3of4: string;
    noEmployeeSelected: string; availableTimesOn: string; noTimesAvailable: string;
    contactData: string; step4of4: string;
    firstName: string; lastName: string; email: string; phone: string;
    treatmentLabel: string; dateTime: string; specialist: string;
    totalAmount: string; inclVat: string;
    privacy: string; privacyLink: string; privacyAnd: string;
    bookAppointment: string; booking: string;
    errorFixFields: string; errorFillAll: string; acceptPrivacy: string;
    firstNameRequired: string; firstNameMinLength: string;
    lastNameRequired: string; lastNameMinLength: string;
    emailRequired: string; emailInvalid: string;
    phoneRequired: string; phoneMinLength: string;
    errorLoadServices: string; errorLoadAvailability: string;
    errorFillRequired: string; errorPrivacy: string;
    errorFillAllRequired: string; errorInvalidEmail: string; errorBooking: string;
    bookingSystemNotFound: string; bookingSystemNotFoundDesc: string; bookingSystemNotFoundDesc2: string;
    unavailableTitle: string; unavailableDesc: string;
    locationStep: string; chooseLocation: string; stepOf: string;
    finderTitle: string; finderDesc: string; finderStart: string;
    waitlistOpen: string; waitlistFirstLastRequired: string;
    waitlistPreferredTimeRequired: string; waitlistError: string;
    waitlistSuccessTitle: string; waitlistSuccessDesc: string;
    waitlistFor: string; waitlistAt: string; waitlistAnyTime: string;
    waitlistExactTime: string; waitlistPreferredTime: string;
    waitlistOtherEmployees: string; notesOptional: string;
    waitlistSubmitting: string; waitlistSubmit: string;
  };
  admin: {
    dashboard: string; calendar: string; bookings: string; customers: string;
    services: string; employees: string; absences: string; tracking: string;
    myLinks: string; settings: string; subscription: string; logout: string;
    overview: string; teamAndServices: string; analytics: string; administration: string;
    new: string; edit: string; delete: string; search: string; filter: string;
    export: string; import: string; active: string; inactive: string;
    status: string; name: string; email: string; phone: string;
    date: string; time: string; price: string; duration: string;
    description: string; actions: string; confirmDelete: string; noDataFound: string;
    trialExpired: string; trialExpiredDesc: string;
    requestSent: string; planActivatedIn24h: string;
    subscriptionDetails: string; upgradeNow: string; recommended: string;
    perMonth: string; request: string;
    setupWizard: string; startSetup: string;
    myArea: string; myCalendar: string; noteToAdmin: string;
    inbox: string; inboxTitle: string; unreadNotes: string;
    noteSubject: string; noteMessage: string;
    noteSend: string; noteSending: string; noteSent: string; noteSentDesc: string;
    noteNew: string; noteHistory: string;
    noteSubjectPlaceholder: string; noteMessagePlaceholder: string;
    noteRead: string; noteUnread: string; noteFrom: string; noteMarkRead: string;
    noteNoMessages: string; noteNoMessagesDesc: string;
    noteNoSent: string; noteNoSentDesc: string;
    subjectOptions: readonly string[];
  };
};
