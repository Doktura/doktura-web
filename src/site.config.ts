// Zentrale Angaben der Webseite.
// Kontaktdaten, Links und Rechtsangaben stehen in src/content/einstellungen.json
// und lassen sich im Redaktionssystem (doktura.de/admin) unter „Einstellungen“ ändern.
import s from './content/einstellungen.json';
import { hasPlaceholder } from './placeholders';

// Solange kein echter Terminlink (Calendly oder Cal.com) eingetragen ist, führen die Termin-Buttons zum Kontaktformular.
const calReady = !!s.calUrl && !hasPlaceholder(s.calUrl);

export const site = {
  name: 'Doktura',
  claim: 'Finanzberatung für Ärzte',
  description:
    'Finanzberatung nur für Ärztinnen, Ärzte und Zahnärzte: Berufsunfähigkeit, Praxisabsicherung und Altersvorsorge. Kostenloses Erstgespräch, persönlich oder per Video.',

  calReady,
  calUrl: calReady ? s.calUrl : '/#kontakt',
  calAttrs: (calReady ? { target: '_blank', rel: 'noopener' } : {}) as Record<string, string>,
  calIcon: (calReady ? 'arrow-up-right' : 'arrow-right') as 'arrow-up-right' | 'arrow-right',

  contact: {
    person: s.kontakt.person,
    email: s.kontakt.email,
    phone: s.kontakt.telefon, // leer lassen blendet die Telefonnummer aus
    address: s.kontakt.adresse,
  },

  // leer oder Platzhalter: Instagram-Link wird ausgeblendet
  instagram: s.instagram && !hasPlaceholder(s.instagram) ? s.instagram : '',

  // Meta Pixel: bleibt aus, solange in „Einstellungen“ keine ID steht.
  // Mit ID erscheint das Cookie-Banner; das Pixel lädt nur nach Zustimmung (Kategorie „Marketing“).
  metaPixelId: /^\d{6,20}$/.test((s as any).metaPixelId?.trim() ?? '') ? (s as any).metaPixelId.trim() as string : '',

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
  { label: 'Check', href: '/#check' },
  { label: 'Leistungen', href: '/#leistungen' },
  { label: 'Über mich', href: '/#zamin' },
  { label: 'Fragen', href: '/#fragen' },
];
