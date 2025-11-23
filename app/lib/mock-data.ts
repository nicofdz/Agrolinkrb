export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  harvestWindow: string;
  priceRange: string;
  availability: "Alta" | "Media" | "Baja";
  sustainability: string;
  highlights: string[];
};

export type Producer = {
  slug: string;
  name: string;
  location: string;
  focus: string;
  summary: string;
  certifications: string[];
  badges: string[];
  logisticsNotes: string[];
  impact: {
    wasteReduction: string;
    priceStability: string;
    deliveryPunctuality: string;
  };
  supportChannels: string[];
  timeline: { title: string; detail: string; duration: string }[];
  inventory: InventoryItem[];
};

export const producers: Producer[] = [
  {
    slug: "cooperativa-rio-verde",
    name: "Cooperativa Río Verde",
    location: "Río Bueno · Huertos mixtos",
    focus: "Hortalizas de hoja, tubérculos y huevos de gallinas libres",
    summary:
      "Red de 12 familias agricultoras que buscan compradores constantes para estabilizar ingresos y planificar siembras.",
    certifications: ["Certificación INDAP", "Buenas Prácticas Agrícolas"],
    badges: ["Sello AgroLink", "Entrega agrupada", "Pagos en 48H"],
    logisticsNotes: [
      "Despachos martes y viernes con ruta consolidada",
      "Tracking por WhatsApp y confirmación con foto",
    ],
    impact: {
      wasteReduction: "−38% merma",
      priceStability: "Precios fijos por temporada",
      deliveryPunctuality: "95% entregas puntuales",
    },
    supportChannels: ["WhatsApp asistido", "Mesa de ayuda AgroLink"],
    timeline: [
      {
        title: "Confirmación de disponibilidad",
        detail: "Respuesta en menos de 2 horas hábiles.",
        duration: "0-2h",
      },
      {
        title: "Preparación y empaque",
        detail: "Selección por lote con checklist de calidad y fotos.",
        duration: "4h",
      },
      {
        title: "Entrega consolidada",
        detail: "Ruta optimizada Osorno · Río Bueno con tracking GPS.",
        duration: "24h",
      },
    ],
    inventory: [
      {
        id: "rv-espinaca",
        name: "Espinaca baby agroecológica",
        category: "Hojas verdes",
        harvestWindow: "Todo el año · peak otoño",
        priceRange: "$4.500 - $5.200 / kg",
        availability: "Alta",
        sustainability: "Riego por goteo + compost local",
        highlights: ["Lavada y lista para mise en place", "Cajas reutilizables"],
      },
      {
        id: "rv-betarraga",
        name: "Betarraga",
        category: "Raíces y tubérculos",
        harvestWindow: "Marzo - Junio",
        priceRange: "$3.200 / kg",
        availability: "Media",
        sustainability: "Rotación de suelos + cero pesticidas",
        highlights: ["Ideal para conservas y pickles", "Trazabilidad por lote"],
      },
    ],
  },
  {
    slug: "granjas-trufquen",
    name: "Granjas Trufquén",
    location: "Osorno · Producción regenerativa",
    focus: "Hierbas aromáticas, microgreens y huevos certificados",
    summary:
      "Emprendimiento liderado por dos hermanas chefs que migraron al campo para cultivar ingredientes de alta demanda gastronómica.",
    certifications: ["Orgánico en transición", "Programa Buenas Prácticas"],
    badges: ["Joyas de temporada", "Atención 24/7", "Entrega express"],
    logisticsNotes: [
      "Microgreens cortados 12h antes del despacho",
      "Servicio express dentro de Osorno",
    ],
    impact: {
      wasteReduction: "−45% merma",
      priceStability: "Suscripción mensual",
      deliveryPunctuality: "Entrega same-day",
    },
    supportChannels: ["Chat en app", "Visitas guiadas"],
    timeline: [
      {
        title: "Pedido programado",
        detail: "Agendado con 48h y confirmación automática.",
        duration: "48h",
      },
      {
        title: "Cosecha bajo demanda",
        detail: "Corte y empaque justo antes de la entrega.",
        duration: "12h",
      },
      {
        title: "Entrega refrigerada",
        detail: "Cadena de frío monitoreada, firma digital.",
        duration: "2h",
      },
    ],
    inventory: [
      {
        id: "gt-microarugula",
        name: "Micro arúgula picante",
        category: "Microgreens",
        harvestWindow: "Todo el año",
        priceRange: "$6.800 / bandeja 200g",
        availability: "Alta",
        sustainability: "Energía solar + riego cerrado",
        highlights: ["Vida útil 8 días", "Ficha de maridaje incluida"],
      },
      {
        id: "gt-huevoazul",
        name: "Huevos azules de gallinas libres",
        category: "Proteína",
        harvestWindow: "Todo el año",
        priceRange: "$3.900 / docena",
        availability: "Media",
        sustainability: "Gallinas en pradera móvil",
        highlights: ["Omega 3 natural", "Control sanitario semanal"],
      },
    ],
  },
  {
    slug: "huerta-kuyen",
    name: "Huerta Küyen",
    location: "San Pablo · Agroecología",
    focus: "Tomates patrimoniales, zapallos y frutos de temporada",
    summary:
      "Proyecto familiar mapuche que rescata semillas nativas y busca aliados gastronómicos para contar su historia en cada plato.",
    certifications: ["Sello Manos Campesinas", "Prácticas agroecológicas"],
    badges: ["Storytelling", "Mapa de origen", "Donación de excedentes"],
    logisticsNotes: [
      "Entrega a agro-puntos definidos",
      "Alianzas con transporte colaborativo",
    ],
    impact: {
      wasteReduction: "−52% merma",
      priceStability: "Precios transparentes",
      deliveryPunctuality: "Ventanas fijas miércoles/sábado",
    },
    supportChannels: ["Acompañamiento telefónico", "Foro AgroLink"],
    timeline: [
      {
        title: "Selección de variedades",
        detail: "Catálogo actualizado cada lunes con fotos reales.",
        duration: "Semanal",
      },
      {
        title: "Consolidación en agro-punto",
        detail: "Productores dejan cajas en punto Küyen Hub.",
        duration: "8h",
      },
      {
        title: "Reparto colaborativo",
        detail: "Camioneta compartida entre 3 restaurantes.",
        duration: "Same-day",
      },
    ],
    inventory: [
      {
        id: "hk-tomate",
        name: "Tomate rosado patrimonial",
        category: "Fruta - Solanáceas",
        harvestWindow: "Enero - Abril",
        priceRange: "$4.800 / kg",
        availability: "Baja",
        sustainability: "Semillas criollas + polinización natural",
        highlights: ["Ideal para ensaladas signature", "Historia imprimible"],
      },
      {
        id: "hk-zapallo",
        name: "Zapallo butternut curado",
        category: "Hortaliza de guarda",
        harvestWindow: "Mayo - Agosto",
        priceRange: "$2.700 / kg",
        availability: "Alta",
        sustainability: "Secado al sol y almacenamiento controlado",
        highlights: ["Pulpa cremosa", "Incluye ficha nutricional"],
      },
    ],
  },
];

export type CatalogItem = InventoryItem & {
  producerSlug: string;
  producerName: string;
  location: string;
  badges: string[];
};

export const catalogItems: CatalogItem[] = producers
  .flatMap((producer) =>
    producer.inventory.map((item) => ({
      ...item,
      producerSlug: producer.slug,
      producerName: producer.name,
      location: producer.location,
      badges: producer.badges,
    })),
  )
  .filter((item) => item.id !== "gt-microarugula"); // Filtrar micro arúgula como solicitado



