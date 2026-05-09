/**
 * Pakistan Military Pension Calculation Engine
 * All calculations based on Finance Division Office Memoranda.
 *
 * RESTORATION RULES (three legal phases):
 *   Phase 1 — Retired on/before 30 Nov 2001  : Normal restoration (age-index based)
 *   Phase 2 — Retired 1 Dec 2001 – 30 Jun 2015: Restoration was WITHDRAWN by Finance
 *             Division OM No.1(5)-Imp/2001 dated 4 Sep 2001, then REINSTATED by
 *             Finance Division circular dated 07-07-2015. Effective restoration =
 *             MAX(calculated date, July 2015).
 *   Phase 3 — Retired on/after 1 Jul 2015     : Normal restoration (age-index based)
 */

// ── Official Finance Division pension increase rates by year ──
const PENSION_RATES = {
  1994: 0.10,
  1995: 0.00,
  1996: 0.00,
  1997: 0.25,   // Grade 1-16 OM; armed forces separate OM — rate same in practice
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
  2009: 0.00,   // UNCONFIRMED — no Finance Division OM found; treated as zero
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
  2020: 0.00,   // COVID fiscal freeze — confirmed zero
  2021: 0.10,
  2022: 0.15,
  2023: 0.175,
  2024: 0.15,
  2025: 0.07
};

// Years whose rates are unconfirmed (flagged in PDF report)
const UNCONFIRMED_YEARS = new Set([2009]);

// Finance Division OM references
const RATE_REFERENCES = {
  1994: 'Finance Division OM 1994',
  1997: 'Finance Division OM 1997 (Grade 1–16; AF separate OM)',
  2002: 'Finance Division OM 2002',
  2003: 'Finance Division OM 2003',
  2004: 'Finance Division OM 2004',
  2005: 'Finance Division OM 2005',
  2006: 'Finance Division OM 2006',
  2007: 'Finance Division OM 2007',
  2008: 'Finance Division OM 2008',
  2009: 'No OM found — assumed 0% (unconfirmed)',
  2010: 'Finance Division OM 2010',
  2011: 'Finance Division OM 2011',
  2012: 'Finance Division OM 2012',
  2013: 'Finance Division OM 2013',
  2014: 'Finance Division OM 2014',
  2015: 'Finance Division OM Jul 2015',
  2016: 'Finance Division OM Jul 2016',
  2017: 'Finance Division OM Jul 2017',
  2018: 'Finance Division OM Jul 2018',
  2019: 'Finance Division OM 15-07-2019',
  2020: 'No increase — COVID fiscal freeze (confirmed)',
  2021: 'Finance Division OM 10-07-2021',
  2022: 'Finance Division OM 01-07-2022',
  2023: 'Finance Division OM 05-07-2023',
  2024: 'Finance Division OM 10-07-2024',
  2025: 'Finance Division OM 07-07-2025'
};

// Standard Pakistan Government commutation factors by age at retirement
const COMMUTATION_FACTORS = {
  35: 29.86, 36: 29.14, 37: 28.40, 38: 27.65, 39: 26.88,
  40: 26.09, 41: 25.29, 42: 24.47, 43: 23.64, 44: 22.79,
  45: 21.93, 46: 21.05, 47: 20.16, 48: 19.25, 49: 18.33,
  50: 17.40, 51: 16.47, 52: 15.54, 53: 14.60, 54: 13.67,
  55: 12.75, 56: 11.84, 57: 10.95, 58: 10.08, 59:  9.22,
  60:  8.39, 61:  7.58, 62:  6.80, 63:  6.06, 64:  5.35,
  65:  4.69
};

// Restoration reinstatement date (Finance Division circular 07-07-2015)
const REINSTATEMENT = { year: 2015, month: 7 };

// ─────────────────────────────────────────────────────────────
// Returns restoration years based on commutation factor (age table)
function getRestorationYears(ageAtRetirement) {
  const age = Math.min(Math.max(parseInt(ageAtRetirement) || 0, 35), 65);
  const factor = COMMUTATION_FACTORS[age];
  return factor ? Math.ceil(factor) : null;
}

// ─────────────────────────────────────────────────────────────
// Returns effective restoration date + metadata, respecting all three legal phases.
function getRestorationInfo(retireMonth, retireYear, ageAtRetirement) {
  if (!ageAtRetirement) return null;

  const restorationYears = getRestorationYears(ageAtRetirement);
  if (!restorationYears) return null;

  const calcDate = addYearsToDate(retireMonth, retireYear, restorationYears);
  const calcTotal = calcDate.year * 12 + calcDate.month;
  const reinTotal = REINSTATEMENT.year * 12 + REINSTATEMENT.month;

  // Determine which legal phase this retiree falls into
  const retireTotal = retireYear * 12 + retireMonth;
  const cutoffTotal = 2001 * 12 + 11; // Nov 2001

  if (retireTotal <= cutoffTotal) {
    // Phase 1 — pre-2001: normal restoration
    return { year: calcDate.year, month: calcDate.month, rule: 'pre2001', calcDate, restorationYears };
  }

  const reinstatementCutoff = REINSTATEMENT.year * 12 + REINSTATEMENT.month - 1; // Jun 2015
  if (retireTotal <= reinstatementCutoff) {
    // Phase 2 — Dec 2001 to Jun 2015: restoration reinstated from Jul 2015
    if (calcTotal < reinTotal) {
      // Their commutation period expired BEFORE July 2015 — they get restored in July 2015
      const lateMonths = reinTotal - calcTotal;
      return {
        year: REINSTATEMENT.year, month: REINSTATEMENT.month,
        rule: 'reinstated_2015', calcDate, restorationYears, lateMonths
      };
    } else {
      // Their commutation period expires AFTER July 2015 — normal restoration applies
      return { year: calcDate.year, month: calcDate.month, rule: 'reinstated_2015_future', calcDate, restorationYears, lateMonths: 0 };
    }
  }

  // Phase 3 — post Jul 2015: normal restoration
  return { year: calcDate.year, month: calcDate.month, rule: 'post2015', calcDate, restorationYears };
}

// ─────────────────────────────────────────────────────────────
/**
 * Main calculation function.
 *
 * @param {object} p
 * @param {string}  p.pensionerType     - 'primary' | 'family'
 * @param {number}  p.grossPension      - Gross pension at start date (Rs./month)
 * @param {number}  p.retireYear        - Year of retirement / family pension start
 * @param {number}  p.retireMonth       - Month of retirement / family pension start (1-12)
 * @param {boolean} p.commuted          - Whether pension was commuted (primary only)
 * @param {number}  p.commutedPct       - Commutation percentage (0.25 / 0.35 / 0.50)
 * @param {number}  p.commutedAmount    - Commuted monthly amount (Rs.)
 * @param {number|null} p.ageAtRetirement
 * @param {boolean} p.restored          - Whether restoration has occurred
 * @param {number|null} p.restoreYear   - Actual restoration year (if restored)
 * @param {number|null} p.restoreMonth  - Actual restoration month (if restored)
 * @param {number}  p.currentPension    - Pension currently being drawn
 * @param {number}  p.medicalAllowance  - Monthly medical allowance (excluded from increase base)
 * @returns {object}
 */
function calculatePension(p) {
  const {
    pensionerType = 'primary',
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
    currentPension,
    medicalAllowance = 0
  } = p;

  const CURRENT_YEAR = 2026;
  const trail = [];
  const isFamily = pensionerType === 'family';

  // Family pension: no commutation, no restoration — just apply increases to gross
  const retainedPension = (commuted && !isFamily) ? (grossPension - commutedAmount) : grossPension;

  // Restoration info (primary only, commuted only)
  let restoInfo = null;
  if (commuted && !isFamily && ageAtRetirement) {
    restoInfo = getRestorationInfo(retireMonth, retireYear, ageAtRetirement);
  }

  // Effective restoration: use user-supplied date if confirmed, else calculated
  const effectiveRestoreYear  = (restored && restoreYear)  ? restoreYear  : (restoInfo ? restoInfo.year  : null);
  const effectiveRestoreMonth = (restored && restoreMonth) ? restoreMonth : (restoInfo ? restoInfo.month : null);

  // ── Build year-by-year trail ───────────────────────────────
  let pension = retainedPension;
  let hasBeenRestored = false;

  trail.push({
    year: retireYear, month: retireMonth,
    event: isFamily ? 'Family pension start' : 'Retirement — base pension',
    rate: null,
    pension: Math.round(pension),
    note: isFamily
      ? 'Family pension at grant date'
      : commuted
        ? `Gross Rs.${Math.round(grossPension)} — commuted ${(commutedPct * 100).toFixed(0)}% — retained portion`
        : 'Full gross pension (no commutation)'
  });

  for (let year = retireYear + 1; year <= CURRENT_YEAR; year++) {
    const rate = PENSION_RATES[year] ?? 0;

    // Check restoration this year (primary commuted only)
    if (!hasBeenRestored && !isFamily && commuted && effectiveRestoreYear && year === effectiveRestoreYear) {
      hasBeenRestored = true;

      // Add back commuted portion, then apply this year's increase
      const restoredBase  = pension + commutedAmount;
      // Medical allowance excluded from increase base; guard against MA > pension
      const increaseBase  = Math.max(0, restoredBase - medicalAllowance);
      const afterIncrease = medicalAllowance + increaseBase * (1 + rate);

      trail.push({
        year,
        month: effectiveRestoreMonth,
        event: rate > 0
          ? `Restoration + ${(rate * 100).toFixed(1)}% increase`
          : 'Restoration — commuted portion returned',
        rate,
        pension: Math.round(afterIncrease),
        note: `Commuted Rs.${Math.round(commutedAmount)}/mo restored. ${RATE_REFERENCES[year] || ''}`
          + (restoInfo && restoInfo.rule === 'reinstated_2015' && restoInfo.lateMonths > 0
            ? ` [LATE: restored ${restoInfo.lateMonths} months after calculated date due to Sep 2001 OM withdrawal]`
            : ''),
        isRestoration: true
      });

      pension = afterIncrease;
      continue;
    }

    if (rate === 0) {
      trail.push({
        year, event: 'No increase', rate: 0,
        pension: Math.round(pension),
        note: RATE_REFERENCES[year] || 'No increase',
        unconfirmed: UNCONFIRMED_YEARS.has(year)
      });
    } else {
      // Medical allowance excluded from increase base (Finance Division OMs specify net pension minus MA)
      const increaseBase = Math.max(0, pension - medicalAllowance);
      pension = medicalAllowance + increaseBase * (1 + rate);

      trail.push({
        year, event: 'Finance Division increase',
        rate, pension: Math.round(pension),
        note: RATE_REFERENCES[year] || '',
        unconfirmed: UNCONFIRMED_YEARS.has(year)
      });
    }
  }

  const correctPension = Math.round(pension);
  const difference = correctPension - currentPension;
  const TOLERANCE = 100;

  const status = difference > TOLERANCE ? 'underpaid'
               : difference < -TOLERANCE ? 'overpaid'
               : 'correct';

  const monthlyShortfall = Math.max(0, difference);
  const annualShortfall  = monthlyShortfall * 12;

  // Restoration delay (if user confirmed restoration but later than expected)
  let restorationDelay = null;
  if (commuted && !isFamily && restored && restoInfo) {
    const actTotal  = restoreYear  * 12 + restoreMonth;
    const calcTotal = restoInfo.calcDate.year * 12 + restoInfo.calcDate.month;
    const estEff    = restoInfo.year * 12 + restoInfo.month; // effective expected date

    // If user says restored, compare against effective expected date
    if (actTotal > estEff) {
      const delayMonths = actTotal - estEff;
      restorationDelay = { delayMonths, arrears: Math.round(commutedAmount * delayMonths) };
    }
  }

  // Lump sum verification
  let lumpSumCalc = null;
  if (commuted && !isFamily && ageAtRetirement) {
    const age = Math.min(Math.max(parseInt(ageAtRetirement), 35), 65);
    const factor = COMMUTATION_FACTORS[age];
    if (factor) lumpSumCalc = Math.round(commutedAmount * 12 * factor);
  }

  return {
    pensionerType,
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
    medicalAllowance,
    restoInfo,
    effectiveRestoreYear,
    effectiveRestoreMonth,
    restorationDelay,
    lumpSumCalc
  };
}

// ── Utility ──────────────────────────────────────────────────

// Add N years to a month/year, returns {month, year}
function addYearsToDate(month, year, years) {
  const totalMonths = year * 12 + (month - 1) + Math.round(years * 12);
  return { year: Math.floor(totalMonths / 12), month: (totalMonths % 12) + 1 };
}

function formatRs(amount) {
  return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
}

const MONTHS_EN = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
const MONTHS_UR = ['جنوری','فروری','مارچ','اپریل','مئی','جون',
                   'جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];

function monthName(monthNum, lang) {
  const idx = parseInt(monthNum) - 1;
  if (idx < 0 || idx > 11) return '?';
  return lang === 'ur' ? MONTHS_UR[idx] : MONTHS_EN[idx];
}

// Maximum commutation % allowed by retirement date
function maxCommutationPct(retireYear, retireMonth) {
  // Post July 2015: cap is 35%
  if (retireYear > 2015 || (retireYear === 2015 && retireMonth >= 7)) return 0.35;
  // Pre-July 2015: historically 50% was possible for armed forces
  return 0.50;
}
