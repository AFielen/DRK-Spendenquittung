import { useReducer, useCallback } from 'react';
import type { Spender } from './types';

// ── State Types ──

export interface SpenderFormState {
  istFirma: boolean;
  firmenname: string;
  anrede: string;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  steuerIdNr: string;
}

export interface ZuwendungFormState {
  art: 'geld' | 'sach';
  verwendung: 'spende' | 'mitgliedsbeitrag';
  betrag: string;
  datum: string;
  zugangsweg: string;
  verzicht: boolean;
  bemerkung: string;
  zweckgebunden: boolean;
  zweckbindung: string;
  // Sachzuwendung
  sachBezeichnung: string;
  sachAlter: string;
  sachZustand: string;
  sachKaufpreis: string;
  sachWert: string;
  sachHerkunft: 'privatvermoegen' | 'betriebsvermoegen' | 'keine_angabe';
  sachBewertungsgrundlage: 'rechnung' | 'eigene_ermittlung' | 'gutachten' | null;
  sachWertermittlung: string;
  sachEntnahmewert: string;
  sachUmsatzsteuer: string;
  sachUnterlagenVorhanden: boolean;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  saving: boolean;
  error: string;
  // Step 1
  mode: 'select' | 'create';
  spenderId: string;
  spenderSuche: string;
  dropdownOpen: boolean;
  highlightedIndex: number;
  duplicateWarning: Spender | null;
  spenderForm: SpenderFormState;
  // Step 2
  zuwendungForm: ZuwendungFormState;
  // Step 3
  abschlussWahl: 'spendenbuch' | 'bestaetigung';
  // Step 4
  createdSpender: Spender | null;
  bestaetigungErstellt: boolean;
  bestaetigungWarnung: string;
}

// ── Initial State ──

const initialSpenderForm: SpenderFormState = {
  istFirma: false,
  firmenname: '',
  anrede: '',
  vorname: '',
  nachname: '',
  strasse: '',
  plz: '',
  ort: '',
  steuerIdNr: '',
};

const initialZuwendungForm: ZuwendungFormState = {
  art: 'geld',
  verwendung: 'spende',
  betrag: '',
  datum: new Date().toISOString().split('T')[0],
  zugangsweg: '',
  verzicht: false,
  bemerkung: '',
  zweckgebunden: false,
  zweckbindung: '',
  sachBezeichnung: '',
  sachAlter: '',
  sachZustand: '',
  sachKaufpreis: '',
  sachWert: '',
  sachHerkunft: 'privatvermoegen',
  sachBewertungsgrundlage: null,
  sachWertermittlung: '',
  sachEntnahmewert: '',
  sachUmsatzsteuer: '',
  sachUnterlagenVorhanden: false,
};

const initialState: WizardState = {
  step: 1,
  saving: false,
  error: '',
  mode: 'select',
  spenderId: '',
  spenderSuche: '',
  dropdownOpen: false,
  highlightedIndex: -1,
  duplicateWarning: null,
  spenderForm: { ...initialSpenderForm },
  zuwendungForm: { ...initialZuwendungForm },
  abschlussWahl: 'spendenbuch',
  createdSpender: null,
  bestaetigungErstellt: false,
  bestaetigungWarnung: '',
};

// ── Actions ──

type WizardAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_MODE'; mode: 'select' | 'create' }
  | { type: 'SET_SPENDER_ID'; id: string }
  | { type: 'SET_SPENDER_SUCHE'; value: string }
  | { type: 'SET_DROPDOWN_OPEN'; open: boolean }
  | { type: 'SET_HIGHLIGHTED_INDEX'; index: number }
  | { type: 'SET_DUPLICATE_WARNING'; spender: Spender | null }
  | { type: 'UPDATE_SPENDER_FORM'; field: keyof SpenderFormState; value: SpenderFormState[keyof SpenderFormState] }
  | { type: 'UPDATE_ZUWENDUNG_FORM'; field: keyof ZuwendungFormState; value: ZuwendungFormState[keyof ZuwendungFormState] }
  | { type: 'SET_ABSCHLUSS_WAHL'; wahl: 'spendenbuch' | 'bestaetigung' }
  | { type: 'SET_CREATED_SPENDER'; spender: Spender | null }
  | { type: 'SET_BESTAETIGUNG_ERSTELLT'; value: boolean }
  | { type: 'SET_BESTAETIGUNG_WARNUNG'; value: string }
  | { type: 'SELECT_SPENDER'; spender: Spender }
  | { type: 'RESET' };

// ── Reducer ──

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'SET_SPENDER_ID':
      return { ...state, spenderId: action.id };
    case 'SET_SPENDER_SUCHE':
      return { ...state, spenderSuche: action.value };
    case 'SET_DROPDOWN_OPEN':
      return { ...state, dropdownOpen: action.open };
    case 'SET_HIGHLIGHTED_INDEX':
      return { ...state, highlightedIndex: action.index };
    case 'SET_DUPLICATE_WARNING':
      return { ...state, duplicateWarning: action.spender };
    case 'UPDATE_SPENDER_FORM':
      return { ...state, spenderForm: { ...state.spenderForm, [action.field]: action.value } };
    case 'UPDATE_ZUWENDUNG_FORM':
      return { ...state, zuwendungForm: { ...state.zuwendungForm, [action.field]: action.value } };
    case 'SET_ABSCHLUSS_WAHL':
      return { ...state, abschlussWahl: action.wahl };
    case 'SET_CREATED_SPENDER':
      return { ...state, createdSpender: action.spender };
    case 'SET_BESTAETIGUNG_ERSTELLT':
      return { ...state, bestaetigungErstellt: action.value };
    case 'SET_BESTAETIGUNG_WARNUNG':
      return { ...state, bestaetigungWarnung: action.value };
    case 'SELECT_SPENDER':
      return {
        ...state,
        spenderId: action.spender.id,
        spenderSuche: '',
        dropdownOpen: false,
        highlightedIndex: -1,
      };
    case 'RESET':
      return { ...initialState, zuwendungForm: { ...initialZuwendungForm, datum: new Date().toISOString().split('T')[0] } };
    default:
      return state;
  }
}

// ── Hook ──

export function useWizardState() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const setStep = useCallback((step: 1 | 2 | 3 | 4) => dispatch({ type: 'SET_STEP', step }), []);
  const setSaving = useCallback((saving: boolean) => dispatch({ type: 'SET_SAVING', saving }), []);
  const setError = useCallback((error: string) => dispatch({ type: 'SET_ERROR', error }), []);
  const setMode = useCallback((mode: 'select' | 'create') => dispatch({ type: 'SET_MODE', mode }), []);
  const setSpenderId = useCallback((id: string) => dispatch({ type: 'SET_SPENDER_ID', id }), []);
  const setSpenderSuche = useCallback((value: string) => dispatch({ type: 'SET_SPENDER_SUCHE', value }), []);
  const setDropdownOpen = useCallback((open: boolean) => dispatch({ type: 'SET_DROPDOWN_OPEN', open }), []);
  const setHighlightedIndex = useCallback((index: number) => dispatch({ type: 'SET_HIGHLIGHTED_INDEX', index }), []);
  const setDuplicateWarning = useCallback((spender: Spender | null) => dispatch({ type: 'SET_DUPLICATE_WARNING', spender }), []);
  const updateSpenderForm = useCallback(
    <K extends keyof SpenderFormState>(field: K, value: SpenderFormState[K]) =>
      dispatch({ type: 'UPDATE_SPENDER_FORM', field, value }),
    [],
  );
  const updateZuwendungForm = useCallback(
    <K extends keyof ZuwendungFormState>(field: K, value: ZuwendungFormState[K]) =>
      dispatch({ type: 'UPDATE_ZUWENDUNG_FORM', field, value }),
    [],
  );
  const setAbschlussWahl = useCallback((wahl: 'spendenbuch' | 'bestaetigung') => dispatch({ type: 'SET_ABSCHLUSS_WAHL', wahl }), []);
  const setCreatedSpender = useCallback((spender: Spender | null) => dispatch({ type: 'SET_CREATED_SPENDER', spender }), []);
  const setBestaetigungErstellt = useCallback((value: boolean) => dispatch({ type: 'SET_BESTAETIGUNG_ERSTELLT', value }), []);
  const setBestaetigungWarnung = useCallback((value: string) => dispatch({ type: 'SET_BESTAETIGUNG_WARNUNG', value }), []);
  const selectSpender = useCallback((spender: Spender) => dispatch({ type: 'SELECT_SPENDER', spender }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state,
    setStep,
    setSaving,
    setError,
    setMode,
    setSpenderId,
    setSpenderSuche,
    setDropdownOpen,
    setHighlightedIndex,
    setDuplicateWarning,
    updateSpenderForm,
    updateZuwendungForm,
    setAbschlussWahl,
    setCreatedSpender,
    setBestaetigungErstellt,
    setBestaetigungWarnung,
    selectSpender,
    reset,
  };
}
