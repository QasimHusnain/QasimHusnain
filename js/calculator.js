/**
 * Pakistan Military Pension Calculation Engine
 * All calculations based on Finance Division Office Memoranda.
 */

// Official Finance Division pension increase rates by year
const PENSION_RATES = {
  1994: 0.10,
  1995: 0.00,
  1996: 0.00,
  1997: 0.25,
  1998: 0.00,
  1999: 0.00,
  2000: 0.00,
  2001: 0.00,
  2002: 0.05,
  2003: 0.15,
  2004: 0.08,
  2005: 0.15,
  2006: 0.10,
  2007: 0.15,
  2008: 0.20,
  2009: 0.00,
  2010: 0.15,
  2011: 0.15,
  2012: 0.20,
  2013: 0.10,
  2014: 0.10,
  2015: 0.075,
  2016: 0.10,
  2017: 0.10,
  2018: 0.10,
  2019: 0.10,
  2020: 0.00,
  2021: 0.10,
  2022: 0.15,
  2023: 0.175,
  2024: 0.15,
  2025: 0.07
};

// Finance Division OM references (for PDF report)
const RATE_REFERENCES = {
  1994: 'Finance Division OM dated 1994',
  1997: 'Finance Division OM dated 1997',
  2002: 'Finance Division OM dated 2002',
  2003: 'Finance Division OM dated 2003',
  2004: 'Finance Division OM dated 2004',
  2005: 'Finance Division OM dated 2005',
  2006: 'Finance Division OM dated 2006',
  2007: 'Finance Division OM dated 2007',
  2008: 'Finance Division OM dated 2008',
  2010: 'Finance Division OM dated 2010',
  2011: 'Finance Division OM dated 2011',
  2012: 'Finance Division OM dated 2012',
  2013: 'Finance Division OM dated 2013',
  2014: 'Finance Division OM dated 2014',
  2015: 'Finance Division OM dated Jul 2015',
  2016: 'Finance Division OM dated Jul 2016',
  2017: 'Finance Division OM dated Jul 2017',
  2018: 'Finance Division OM dated Jul 2018',
  2019: 'Finance Division OM dated 15-07-2019',
  2020: 'No increase — COVID fiscal freeze',
  2021: 'Finance Division OM dated 10-07-2021',
  2022: 'Finance Division OM dated 01-07-2022',
  2023: 'Finance Division OM dated 05-07-2023',
  2024: 'Finance Division OM dated 10-07-2024',
  2025: 'Finance Division OM dated 07-07-2025'
};

// Commutation factors by age (used for lump sum calculation)
// Standard Pakistan Government commutation table
const COMMUTATION_FACTORS = {
  35: 29.86, 36: 29.14, 37: 28.40, 38: 27.65, 39: 26.88,
  40: 26.09, 41: 25.29, 42: 24.47, 43: 23.64, 44: 22.79,
  45: 21.93, 46: 21.05, 47: 20.16, 48: 19.25, 49: 18.33,
  50: 17.40, 51: 16.47, 52: 15.54, 53: 14.60, 54: 13.67,
  55: 12.75, 56: 11.84, 57: 10.95, 58: 10.08,  59: 9.22,
  60: 8.39,  61: 7.58,  62: 6.80,  63: 6.06,  64: 5.35,
  65: 4.69
};

// Restoration period in years based on age at retirement
function getRestorationYears(ageAtRetirement) {
  const age = parseInt(ageAtRetirement);
  if (!age) return null;
  const factor = COMMUTATION_FACTORS[age] || COMMUTATION_FACTORS[Math.min(Math.max(age, 35), 65)];
  // Restoration happens when commuted amount is fully recovered
  // Restoration years = commutation factor (rounded up)
  return Math.ceil(factor);
}

/**
 * Main calculation function.
 * Returns complete pension trail and comparison.
 *
 * @param {object} params
 * @param {number} params.grossPension         - Gross pension at retirement (Rs./month)
 * @param {number} params.retireYear           - Year of retirement
 * @param {number} params.retireMonth          - Month of retirement (1-12)
 * @param {boolean} params.commuted            - Whether pension was commuted
 * @param {number} params.commutedPct          - Commutation percentage (0.25 / 0.35 / 0.50)
 * @param {number} params.commutedAmount       - Commuted monthly amount (Rs.) — auto or manual
 * @param {number|null} params.ageAtRetirement - Age at retirement (for commutation factor)
 * @param {boolean} params.restored            - Whether pension has been restored
 * @param {number|null} params.restoreYear     - Year of restoration (if restored)
 * @param {number|null} params.restoreMonth    - Month of restoration (if restored)
 * @param {number} params.currentPension       - Pension currently being drawn
 * @returns {object} Calculation result
 */
function calculatePension(params) {
  const {
    grossPension,
    retireYear,
    retireMonth,
    commuted,
    commutedPct,
    commutedAmount,
    ageAtRetirement,
    restored,
    restoreYear,
    restoreMonth,
    currentPension
  } = params;

  const CURRENT_YEAR = 2026;
  const trail = [];

  // Retained pension = what is paid month-to-month (gross minus commuted)
  const retainedPension = commuted ? (grossPension - commutedAmount) : grossPension;

  // Determine restoration date
  let estRestoreYear = null;
  let estRestoreMonth = null;
  let restorationYears = null;

  if (commuted && ageAtRetirement) {
    restorationYears = getRestorationYears(ageAtRetirement);
    if (restorationYears) {
      const estRestoreDate = addYearsToDate(retireMonth, retireYear, restorationYears);
      estRestoreYear = estRestoreDate.year;
      estRestoreMonth = estRestoreDate.month;
    }
  }

  // Effective restore year/month (actual if restored, estimated otherwise)
  const effectiveRestoreYear  = restored ? restoreYear  : estRestoreYear;
  const effectiveRestoreMonth = restored ? restoreMonth : estRestoreMonth;

  // Build year-by-year trail
  let pension = retainedPension;
  let hasBeenRestored = false;
  let pensionBeforeRestore = retainedPension;

  trail.push({
    year: retireYear,
    month: retireMonth,
    event: 'Retirement — base pension',
    rate: null,
    pension: commuted ? retainedPension : grossPension,
    gross: grossPension,
    note: commuted ? `Commuted ${(commutedPct * 100).toFixed(0)}% — retained portion` : 'Full gross pension'
  });

  for (let year = retireYear + 1; year <= CURRENT_YEAR; year++) {
    const rate = PENSION_RATES[year] ?? 0;

    // Check if restoration happens this year
    if (!hasBeenRestored && effectiveRestoreYear && year === effectiveRestoreYear) {
      // Restoration: pension doubles (retained × 2 = retained + commuted portion restored)
      const pensionAtRestore = pension * (1 + rate); // apply increase first if same year
      const restoredPension = pension + commutedAmount; // add back commuted portion

      hasBeenRestored = true;
      pensionBeforeRestore = pension;

      // Apply rate to full restored pension
      const afterRate = restoredPension * (1 + rate);

      trail.push({
        year,
        month: effectiveRestoreMonth,
        event: `Restoration + ${(rate * 100).toFixed(1)}% increase`,
        rate,
        pension: Math.round(afterRate),
        gross: grossPension,
        note: `Commuted portion Rs. ${Math.round(commutedAmount)} restored. Full pension × ${(1 + rate).toFixed(3)}`
      });

      pension = afterRate;
      continue;
    }

    if (rate === 0) {
      trail.push({
        year,
        event: 'No increase',
        rate: 0,
        pension: Math.round(pension),
        gross: grossPension,
        note: RATE_REFERENCES[year] || 'No increase notification'
      });
    } else {
      pension = pension * (1 + rate);
      trail.push({
        year,
        event: `Finance Division increase`,
        rate,
        pension: Math.round(pension),
        gross: grossPension,
        note: RATE_REFERENCES[year] || ''
      });
    }
  }

  const correctPension = Math.round(pension);
  const difference = correctPension - currentPension;
  const TOLERANCE = 100;

  let status;
  if (difference > TOLERANCE) {
    status = 'underpaid';
  } else if (difference < -TOLERANCE) {
    status = 'overpaid';
  } else {
    status = 'correct';
  }

  // Arrears estimate (monthly shortfall × 12 months = annual)
  const monthlyShortfall = Math.max(0, difference);
  const annualShortfall = monthlyShortfall * 12;

  // Check restoration delay
  let restorationDelay = null;
  if (commuted && restored && estRestoreYear) {
    const estTotal = estRestoreYear * 12 + estRestoreMonth;
    const actTotal = restoreYear * 12 + restoreMonth;
    const delayMonths = actTotal - estTotal;
    if (delayMonths > 0) {
      restorationDelay = {
        delayMonths,
        arrears: Math.round(commutedAmount * delayMonths)
      };
    }
  }

  // Lump sum verification
  let lumpSumCalc = null;
  if (commuted && ageAtRetirement) {
    const factor = COMMUTATION_FACTORS[Math.min(Math.max(parseInt(ageAtRetirement), 35), 65)];
    if (factor) {
      lumpSumCalc = Math.round(commutedAmount * 12 * factor);
    }
  }

  return {
    correctPension,
    currentPension,
    difference,
    status,
    monthlyShortfall,
    annualShortfall,
    trail,
    retainedPension: Math.round(retainedPension),
    grossPension,
    commutedAmount: Math.round(commutedAmount || 0),
    estRestoreYear,
    estRestoreMonth,
    effectiveRestoreYear,
    effectiveRestoreMonth,
    restorationDelay,
    lumpSumCalc,
    restorationYears
  };
}

// Add N years to a month/year, returns {month, year}
function addYearsToDate(month, year, years) {
  const totalMonths = year * 12 + (month - 1) + Math.round(years * 12);
  return {
    year: Math.floor(totalMonths / 12),
    month: (totalMonths % 12) + 1
  };
}

// Format Rs. amount with commas
function formatRs(amount) {
  return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
}

// Month names
const MONTHS_EN = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
const MONTHS_UR = ['جنوری','فروری','مارچ','اپریل','مئی','جون',
                   'جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];

function monthName(monthNum, lang) {
  const idx = parseInt(monthNum) - 1;
  return lang === 'ur' ? MONTHS_UR[idx] : MONTHS_EN[idx];
}
