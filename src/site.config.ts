// Zentrale Angaben der Webseite.
// Kontaktdaten, Links und Rechtsangaben stehen in src/content/einstellungen.json
// und lassen sich im Redaktionssystem (doktura.de/admin) unter „Einstellungen“ ändern.
import s from './content/einstellungen.json';

export const site = {
  name: 'Doktura',
  claim: 'Finanzberatung für Ärzte',
  description:
    'Finanzberatung ausschließlich für niedergelassene Ärzte: Absicherung, Praxis, Steuern und Vermögen aus einer Hand.',

  calUrl: s.calUrl,

  contact: {
    person: s.kontakt.person,
    email: s.kontakt.email,
    phone: s.kontakt.telefon, // leer lassen blendet die Telefonnummer aus
    address: s.kontakt.adresse,
  },

  instagram: s.instagram,

  // Meta Pixel: bleibt aus, solange hier nichts steht.
  // Lädt nur nach Zustimmung im Cookie-Banner (Kategorie „Marketing“).
  metaPixelId: '',

  year: new Date().getFullYear(),
};

// Pflichtangaben für Impressum, Erstinformation und Datenschutz.
// Leere Felder ('') werden auf den Seiten ausgeblendet.
const r = s.rechtliches;
export const legal = {
  company: r.firma,
  legalForm: r.rechtsform,
  representative: r.vertreten,
  register: r.handelsregister,
  vatId: r.ustId,
  permits: r.erlaubnisse,
  permitShort: r.erlaubnisKurz,
  registerNo: r.registernummer,
  chamber: r.ihk,
  chamberShort: r.ihkKurz,
  // Beteiligungen ≥ 10 % an/von Versicherungsunternehmen
  holdings: 'Es bestehen keine direkten oder indirekten Beteiligungen von über 10 % an den Stimmrechten oder am Kapital eines Versicherungsunternehmens. Ein Versicherungsunternehmen oder Mutterunternehmen eines Versicherungsunternehmens hält keine direkte oder indirekte Beteiligung von über 10 % an den Stimmrechten oder am Kapital unseres Unternehmens.',
};

export const nav = [
  { label: 'Leistungen', href: '/#leistungen' },
  { label: 'Über uns', href: '/#ueber-uns' },
  { label: 'Ablauf', href: '/#ablauf' },
  { label: 'Kontakt', href: '/#kontakt' },
];
