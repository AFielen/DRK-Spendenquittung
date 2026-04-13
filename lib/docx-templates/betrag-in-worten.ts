// betragInWorten(0.00) → "null Euro"
// betragInWorten(1.00) → "ein Euro"
// betragInWorten(1.01) → "ein Euro und ein Cent"
// betragInWorten(23.50) → "dreiundzwanzig Euro und fünfzig Cent"
// betragInWorten(100.00) → "einhundert Euro"
// betragInWorten(1322.50) → "eintausenddreihundertzweiundzwanzig Euro und fünfzig Cent"
// betragInWorten(10000.00) → "zehntausend Euro"

const EINER = [
  '', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun',
  'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn',
  'siebzehn', 'achtzehn', 'neunzehn',
];

const ZEHNER = [
  '', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig',
  'achtzig', 'neunzig',
];

function zahlwortUnter1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return EINER[n];

  const einer = n % 10;
  const zehner = Math.floor((n % 100) / 10);
  const hunderter = Math.floor(n / 100);

  let result = '';

  if (hunderter > 0) {
    result += EINER[hunderter] + 'hundert';
  }

  const rest = n % 100;
  if (rest === 0) {
    // nichts
  } else if (rest < 20) {
    result += EINER[rest];
  } else {
    if (einer > 0) {
      result += EINER[einer] + 'und';
    }
    result += ZEHNER[zehner];
  }

  return result;
}

function zahlwort(n: number): string {
  if (n === 0) return 'null';

  const milliarden = Math.floor(n / 1_000_000_000);
  const millionen = Math.floor((n % 1_000_000_000) / 1_000_000);
  const tausender = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  let result = '';

  if (milliarden > 0) {
    if (milliarden === 1) {
      result += 'einemilliarde';
    } else {
      result += zahlwortUnter1000(milliarden) + 'milliarden';
    }
  }

  if (millionen > 0) {
    if (millionen === 1) {
      result += 'einemillion';
    } else {
      result += zahlwortUnter1000(millionen) + 'millionen';
    }
  }

  if (tausender > 0) {
    if (tausender === 1) {
      result += 'eintausend';
    } else {
      result += zahlwortUnter1000(tausender) + 'tausend';
    }
  }

  if (rest > 0) {
    result += zahlwortUnter1000(rest);
  }

  return result;
}

export function betragInWorten(betrag: number): string {
  const euro = Math.floor(betrag);
  const cent = Math.round(betrag * 100) % 100;

  let result = zahlwort(euro) + ' Euro';

  if (cent > 0) {
    result += ' und ' + zahlwort(cent) + ' Cent';
  }

  return result;
}
