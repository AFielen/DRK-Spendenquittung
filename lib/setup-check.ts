import type { Verein } from './types';

export interface FehlenderSchritt {
  schritt: number;
  label: string;
  felder: string[];
}

export interface SetupStatus {
  vollstaendig: boolean;
  fehlendeSchritte: FehlenderSchritt[];
  fortschritt: { abgeschlossen: number; gesamt: number };
}

export function pruefSetupVollstaendigkeit(verein: Verein): SetupStatus {
  const fehlendeSchritte: FehlenderSchritt[] = [];

  // Schritt 1: Stammdaten
  const stammdatenFelder: string[] = [];
  if (!verein.name?.trim()) stammdatenFelder.push('Vereinsname');
  if (!verein.strasse?.trim()) stammdatenFelder.push('Straße');
  if (!verein.plz?.trim()) stammdatenFelder.push('PLZ');
  if (!verein.ort?.trim()) stammdatenFelder.push('Ort');
  if (stammdatenFelder.length > 0) {
    fehlendeSchritte.push({ schritt: 1, label: 'Stammdaten', felder: stammdatenFelder });
  }

  // Schritt 2: Steuerliche Angaben
  const steuerFelder: string[] = [];
  if (!verein.finanzamt?.trim()) steuerFelder.push('Finanzamt');
  if (!verein.steuernummer?.trim()) steuerFelder.push('Steuernummer');
  if (!verein.freistellungsart) steuerFelder.push('Freistellungsart');
  if (!verein.freistellungDatum) steuerFelder.push('Bescheiddatum');
  if (!verein.beguenstigteZwecke || verein.beguenstigteZwecke.length === 0) {
    steuerFelder.push('Begünstigte Zwecke');
  }
  if (steuerFelder.length > 0) {
    fehlendeSchritte.push({ schritt: 2, label: 'Steuerliche Angaben', felder: steuerFelder });
  }

  // Schritt 3: Unterschrift
  const unterschriftFelder: string[] = [];
  if (!verein.unterschriftName?.trim()) unterschriftFelder.push('Name des Unterzeichners');
  if (!verein.unterschriftFunktion?.trim()) unterschriftFelder.push('Funktion');
  if (unterschriftFelder.length > 0) {
    fehlendeSchritte.push({ schritt: 3, label: 'Unterschrift', felder: unterschriftFelder });
  }

  const abgeschlossen = 3 - fehlendeSchritte.length;

  return {
    vollstaendig: fehlendeSchritte.length === 0,
    fehlendeSchritte,
    fortschritt: { abgeschlossen, gesamt: 3 },
  };
}
