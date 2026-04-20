/**
 * FaujiPension — Main application logic
 * Handles: bilingual UI, multi-step form, result display, PDF trigger
 */

// ── State ──────────────────────────────────────────────────
let lang = 'en';
let currentStep = 1;
let calcResult = null;

// ── Rank data by category ──────────────────────────────────
const RANKS = {
  soldier: [
    { val: 'sepoy',         en: 'Sepoy',         ur: 'سپاہی' },
    { val: 'lance_naik',    en: 'Lance Naik',     ur: 'لانس نائیک' },
    { val: 'naik',          en: 'Naik',           ur: 'نائیک' },
    { val: 'havildar',      en: 'Havildar',       ur: 'حوالدار' },
    { val: 'lance_hav',     en: 'Lance Havildar', ur: 'لانس حوالدار' }
  ],
  jco: [
    { val: 'naib_sub',      en: 'Naib Subedar',   ur: 'نائب صوبیدار' },
    { val: 'subedar',       en: 'Subedar',        ur: 'صوبیدار' },
    { val: 'sub_major',     en: 'Subedar Major',  ur: 'صوبیدار میجر' }
  ],
  officer: [
    { val: '2lt',           en: 'Second Lieutenant', ur: 'سیکنڈ لیفٹیننٹ' },
    { val: 'lt',            en: 'Lieutenant',        ur: 'لیفٹیننٹ' },
    { val: 'capt',          en: 'Captain',           ur: 'کیپٹن' },
    { val: 'major',         en: 'Major',             ur: 'میجر' },
    { val: 'lt_col',        en: 'Lieutenant Colonel',ur: 'لیفٹیننٹ کرنل' },
    { val: 'col',           en: 'Colonel',           ur: 'کرنل' },
    { val: 'brig',          en: 'Brigadier',         ur: 'بریگیڈیئر' },
    { val: 'maj_gen',       en: 'Major General',     ur: 'میجر جنرل' }
  ]
};

const MONTHS_OPTIONS = [
  { val: '1',  en: 'January',   ur: 'جنوری' },
  { val: '2',  en: 'February',  ur: 'فروری' },
  { val: '3',  en: 'March',     ur: 'مارچ' },
  { val: '4',  en: 'April',     ur: 'اپریل' },
  { val: '5',  en: 'May',       ur: 'مئی' },
  { val: '6',  en: 'June',      ur: 'جون' },
  { val: '7',  en: 'July',      ur: 'جولائی' },
  { val: '8',  en: 'August',    ur: 'اگست' },
  { val: '9',  en: 'September', ur: 'ستمبر' },
  { val: '10', en: 'October',   ur: 'اکتوبر' },
  { val: '11', en: 'November',  ur: 'نومبر' },
  { val: '12', en: 'December',  ur: 'دسمبر' }
];

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMonthDropdowns();
  initYearDropdowns();
  buildHistoryTable();
  applyLang();

  document.getElementById('category').addEventListener('change', updateRanks);
  document.getElementById('langToggle').addEventListener('click', toggleLang);
  document.getElementById('commutedPct').addEventListener('change', calcCommutedAmount);
  document.getElementById('grossPension').addEventListener('input', calcCommutedAmount);
});

// ── Language ───────────────────────────────────────────────
function toggleLang() {
  lang = lang === 'en' ? 'ur' : 'en';
  applyLang();
}

function applyLang() {
  document.body.classList.toggle('urdu', lang === 'ur');
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');

  // Update all data-en / data-ur text nodes
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`) || el.getAttribute('data-en');
  });

  // Update select options
  document.querySelectorAll('option[data-en]').forEach(opt => {
    opt.textContent = opt.getAttribute(`data-${lang}`) || opt.getAttribute('data-en');
  });

  // Update lang toggle highlight
  document.querySelector('.lang-en').classList.toggle('active-lang', lang === 'en');
  document.querySelector('.lang-ur').classList.toggle('active-lang', lang === 'ur');

  // Rebuild dynamic dropdowns with correct language
  updateRanks();
  rebuildMonthDropdowns();
  buildHistoryTable();
}

function t(enText, urText) {
  return lang === 'ur' ? urText : enText;
}

// ── Month / Year dropdowns ─────────────────────────────────
function initMonthDropdowns() {
  ['retireMonth', 'restoreMonth'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${id === 'retireMonth' ? 'Month' : 'Month'}</option>`;
    MONTHS_OPTIONS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.val;
      opt.setAttribute('data-en', m.en);
      opt.setAttribute('data-ur', m.ur);
      opt.textContent = m.en;
      sel.appendChild(opt);
    });
  });
}

function rebuildMonthDropdowns() {
  ['retireMonth', 'restoreMonth'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.querySelectorAll('option[data-en]').forEach(opt => {
      opt.textContent = opt.getAttribute(`data-${lang}`) || opt.getAttribute('data-en');
    });
    sel.value = current;
  });
}

function initYearDropdowns() {
  const currentYear = new Date().getFullYear();
  ['retireYear', 'restoreYear'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${t('Year', 'سال')}</option>`;
    for (let y = currentYear - 1; y >= 1970; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      sel.appendChild(opt);
    }
  });
}

// ── Rank dropdown ──────────────────────────────────────────
function updateRanks() {
  const category = document.getElementById('category').value;
  const rankSel  = document.getElementById('rank');
  rankSel.innerHTML = `<option value="">${t('Select rank...', 'رینک منتخب کریں...')}</option>`;
  if (!category || !RANKS[category]) return;
  RANKS[category].forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.val;
    opt.textContent = lang === 'ur' ? r.ur : r.en;
    rankSel.appendChild(opt);
  });
}

// ── Commutation helpers ────────────────────────────────────
function toggleCommutation(val) {
  document.getElementById('commutationSection').classList.toggle('hidden', val !== 'yes');
}

function togglePensionMode(val) {
  document.getElementById('grossPensionSection').classList.toggle('hidden', val !== 'yes');
  document.getElementById('currentPensionSection').classList.toggle('hidden', val !== 'no');
}

function toggleRestoration(val) {
  document.getElementById('restorationDateSection').classList.toggle('hidden', val !== 'yes');
}

function calcCommutedAmount() {
  const gross = parseFloat(document.getElementById('grossPension').value) || 0;
  const pct   = parseFloat(document.getElementById('commutedPct').value) || 0.50;
  if (gross > 0) {
    document.getElementById('commutedAmount').value = Math.round(gross * pct);
  }
}

// ── Step navigation ────────────────────────────────────────
function nextStep(from) {
  if (!validateStep(from)) return;
  goToStep(from + 1);

  // Step 4 setup
  if (from + 1 === 4) {
    setupStep4();
  }
}

function prevStep(from) {
  goToStep(from - 1);
}

function goToStep(n) {
  document.getElementById(`step${currentStep}`).classList.remove('active');
  currentStep = n;
  document.getElementById(`step${currentStep}`).classList.add('active');

  // Update progress bar
  document.getElementById('progressBar').style.width = `${(n / 4) * 100}%`;

  // Update step dots
  document.querySelectorAll('.step-dot').forEach(dot => {
    const s = parseInt(dot.getAttribute('data-step'));
    dot.classList.remove('active', 'done');
    if (s === n)     dot.classList.add('active');
    if (s < n)       dot.classList.add('done');
  });

  window.scrollTo({ top: document.getElementById('tool').offsetTop - 70, behavior: 'smooth' });
}

function setupStep4() {
  const commuted   = document.querySelector('input[name="commuted"]:checked').value === 'yes';
  const noNote     = document.getElementById('noCommutationNote');
  const restoSec   = document.getElementById('restorationSection');
  const estBox     = document.getElementById('estimatedRestorationBox');
  const warnBox    = document.getElementById('restorationWarning');

  noNote.classList.toggle('hidden', commuted);
  restoSec.classList.toggle('hidden', !commuted);

  if (!commuted) return;

  // Calculate estimated restore date
  const retireMonth   = parseInt(document.getElementById('retireMonth').value) || 1;
  const retireYear    = parseInt(document.getElementById('retireYear').value) || 1990;
  const ageAtRetire   = parseInt(document.getElementById('ageAtRetirement').value) || 0;
  const restored      = document.querySelector('input[name="restored"]:checked')?.value === 'yes';

  if (ageAtRetire) {
    const yrs = getRestorationYears(ageAtRetire);
    if (yrs) {
      const est = addYearsToDate(retireMonth, retireYear, yrs);
      const estStr = `${monthName(est.month, lang)} ${est.year}`;
      document.getElementById('estimatedRestoreDate').textContent = estStr;
      estBox.classList.remove('hidden');

      // Warn if restoration should have happened but not restored
      const now = new Date();
      const estPast = est.year < now.getFullYear() ||
        (est.year === now.getFullYear() && est.month <= now.getMonth() + 1);

      if (estPast && !restored) {
        const warnText = document.getElementById('restorationWarningText');
        warnText.textContent = t(
          `⚠️ Based on your retirement date and age, your pension restoration was due around ${estStr}. If not yet restored, you may be owed significant arrears. This will be detailed in your paid report.`,
          `⚠️ آپ کی ریٹائرمنٹ کی تاریخ اور عمر کی بنیاد پر، آپ کی پنشن بحالی ${estStr} کے آس پاس ہونی چاہیے تھی۔ اگر ابھی تک بحال نہیں ہوئی، تو آپ کو کافی بقایا جات مل سکتے ہیں۔`
        );
        warnBox.classList.remove('hidden');
      } else {
        warnBox.classList.add('hidden');
      }
    }
  }
}

// ── Validation ─────────────────────────────────────────────
function validateStep(step) {
  const errEl = document.getElementById(`step${step}Error`);
  errEl.classList.add('hidden');
  errEl.textContent = '';

  const err = (msg) => {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    return false;
  };

  if (step === 1) {
    if (!document.getElementById('service').value)
      return err(t('Please select your service branch.', 'براہ کرم اپنی فوجی شاخ منتخب کریں۔'));
    if (!document.getElementById('category').value)
      return err(t('Please select your category.', 'براہ کرم اپنا درجہ منتخب کریں۔'));
    if (!document.getElementById('rank').value)
      return err(t('Please select your rank.', 'براہ کرم اپنا رینک منتخب کریں۔'));
    if (!document.getElementById('retireMonth').value || !document.getElementById('retireYear').value)
      return err(t('Please enter your retirement month and year.', 'براہ کرم ریٹائرمنٹ کا مہینہ اور سال درج کریں۔'));
    const yr = parseInt(document.getElementById('retireYear').value);
    if (yr > new Date().getFullYear())
      return err(t('Retirement date cannot be in the future.', 'ریٹائرمنٹ کی تاریخ مستقبل میں نہیں ہو سکتی۔'));
  }

  if (step === 2) {
    const knowPension = document.querySelector('input[name="knowPension"]:checked').value;
    if (knowPension === 'yes') {
      const gp = parseFloat(document.getElementById('grossPension').value);
      if (!gp || gp <= 0)
        return err(t('Please enter your gross pension at retirement.', 'براہ کرم ریٹائرمنٹ پر مجموعی پنشن درج کریں۔'));
    } else {
      const cp = parseFloat(document.getElementById('currentPensionAlt').value);
      if (!cp || cp <= 0)
        return err(t('Please enter your current pension amount.', 'براہ کرم موجودہ پنشن کی رقم درج کریں۔'));
    }
    const cp = parseFloat(document.getElementById('currentPension').value);
    if (!cp || cp <= 0)
      return err(t('Please enter your current pension being drawn.', 'براہ کرم موجودہ ماہانہ پنشن درج کریں۔'));
  }

  if (step === 3) {
    const commuted = document.querySelector('input[name="commuted"]:checked').value === 'yes';
    if (commuted) {
      const ca = parseFloat(document.getElementById('commutedAmount').value);
      if (!ca || ca <= 0)
        return err(t('Please enter the commuted amount.', 'براہ کرم کمیوٹ شدہ رقم درج کریں۔'));
    }
  }

  return true;
}

// ── Calculate ──────────────────────────────────────────────
function calculate() {
  if (!validateStep(4)) return;

  const service      = document.getElementById('service').value;
  const category     = document.getElementById('category').value;
  const rank         = document.getElementById('rank').value;
  const retireMonth  = parseInt(document.getElementById('retireMonth').value);
  const retireYear   = parseInt(document.getElementById('retireYear').value);

  const knowPension  = document.querySelector('input[name="knowPension"]:checked').value;
  let grossPension;
  if (knowPension === 'yes') {
    grossPension = parseFloat(document.getElementById('grossPension').value);
  } else {
    // Estimate gross from current pension by reverse-calculating increases
    grossPension = estimateGrossFromCurrent(
      parseFloat(document.getElementById('currentPensionAlt').value),
      retireYear
    );
  }

  const currentPension  = parseFloat(document.getElementById('currentPension').value);
  const commuted        = document.querySelector('input[name="commuted"]:checked').value === 'yes';
  const commutedPct     = parseFloat(document.getElementById('commutedPct').value) || 0;
  const commutedAmount  = commuted ? (parseFloat(document.getElementById('commutedAmount').value) || grossPension * commutedPct) : 0;
  const ageAtRetirement = parseInt(document.getElementById('ageAtRetirement').value) || null;
  const restored        = commuted && document.querySelector('input[name="restored"]:checked').value === 'yes';
  const restoreMonth    = restored ? parseInt(document.getElementById('restoreMonth').value) : null;
  const restoreYear     = restored ? parseInt(document.getElementById('restoreYear').value) : null;

  calcResult = calculatePension({
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
  });

  // Attach metadata for PDF
  calcResult.meta = {
    service, category, rank,
    retireMonth, retireYear,
    knowPension, commuted, commutedPct,
    ageAtRetirement, restored, restoreMonth, restoreYear
  };

  showResult(calcResult);
}

// Estimate gross pension by reverse-applying all increases
function estimateGrossFromCurrent(currentPension, retireYear) {
  let p = currentPension;
  const CURRENT_YEAR = 2026;
  for (let year = CURRENT_YEAR; year > retireYear; year--) {
    const rate = PENSION_RATES[year] ?? 0;
    p = p / (1 + rate);
  }
  return Math.round(p);
}

// ── Display Result ─────────────────────────────────────────
function showResult(r) {
  document.getElementById('tool').closest('section').style.display = 'none';
  const resultSec = document.getElementById('resultSection');
  resultSec.classList.remove('hidden');

  // Header
  const serviceName = document.getElementById('service').options[document.getElementById('service').selectedIndex].text;
  const rankName    = document.getElementById('rank').options[document.getElementById('rank').selectedIndex].text;
  document.getElementById('resultService').textContent = `${serviceName} — ${rankName}`;
  document.getElementById('resultRetire').textContent = `${t('Retired:', 'ریٹائرڈ:')} ${monthName(r.meta.retireMonth, lang)} ${r.meta.retireYear}`;

  // Verdict
  const vBox   = document.getElementById('verdictBox');
  const vIcon  = document.getElementById('verdictIcon');
  const vTitle = document.getElementById('verdictTitle');
  const vAmt   = document.getElementById('verdictAmounts');

  vBox.className = 'verdict-box verdict-' + r.status;

  if (r.status === 'underpaid') {
    vIcon.textContent  = '⚠️';
    vTitle.textContent = t('POSSIBLY UNDERPAID', 'ممکنہ طور پر کم ادائیگی');
    vAmt.innerHTML = `
      <div class="verdict-amount-item">
        <div class="amount-label">${t('Drawn', 'مل رہا')}</div>
        <div class="amount-value">${formatRs(r.currentPension)}</div>
      </div>
      <div class="verdict-amount-item highlight-green">
        <div class="amount-label">${t('Calculated', 'حساب')}</div>
        <div class="amount-value green">${formatRs(r.correctPension)}</div>
      </div>
      <div class="verdict-amount-item highlight">
        <div class="amount-label">${t('Shortfall/mo', 'کمی/ماہ')}</div>
        <div class="amount-value red">${formatRs(r.monthlyShortfall)}</div>
      </div>
    `;
  } else if (r.status === 'correct') {
    vIcon.textContent  = '✅';
    vTitle.textContent = t('PENSION APPEARS CORRECT', 'پنشن درست معلوم ہوتی ہے');
    vAmt.innerHTML = `
      <div class="verdict-amount-item">
        <div class="amount-label">${t('Drawn', 'مل رہا')}</div>
        <div class="amount-value">${formatRs(r.currentPension)}</div>
      </div>
      <div class="verdict-amount-item highlight-green">
        <div class="amount-label">${t('Calculated', 'حساب')}</div>
        <div class="amount-value green">${formatRs(r.correctPension)}</div>
      </div>
      <div class="verdict-amount-item">
        <div class="amount-label">${t('Difference', 'فرق')}</div>
        <div class="amount-value">${formatRs(Math.abs(r.difference))}</div>
      </div>
    `;
  } else {
    vIcon.textContent  = '🔍';
    vTitle.textContent = t('POSSIBLE OVERPAYMENT — VERIFY', 'ممکنہ زیادہ ادائیگی — تصدیق کریں');
    vAmt.innerHTML = `
      <div class="verdict-amount-item">
        <div class="amount-label">${t('Drawn', 'مل رہا')}</div>
        <div class="amount-value">${formatRs(r.currentPension)}</div>
      </div>
      <div class="verdict-amount-item">
        <div class="amount-label">${t('Calculated', 'حساب')}</div>
        <div class="amount-value">${formatRs(r.correctPension)}</div>
      </div>
      <div class="verdict-amount-item">
        <div class="amount-label">${t('Excess/mo', 'زیادہ/ماہ')}</div>
        <div class="amount-value">${formatRs(Math.abs(r.difference))}</div>
      </div>
    `;
  }

  // Summary
  const summaryEl = document.getElementById('resultSummary');
  if (r.status === 'underpaid') {
    summaryEl.innerHTML = `
      <p><strong>${t('Estimated annual shortfall:', 'تخمینی سالانہ کمی:')}</strong> ${formatRs(r.annualShortfall)}</p>
      <p style="margin-top:8px;font-size:.85rem;color:#6b7280">
        ${t('This estimate uses official Finance Division rates. The full report includes year-by-year trail, commutation verification, and a formal CMA submission letter.', 'یہ تخمینہ سرکاری فنانس ڈویژن شرحوں پر مبنی ہے۔ مکمل رپورٹ میں سال بہ سال حساب، کمیوٹیشن تصدیق، اور CMA کو باقاعدہ خط شامل ہے۔')}
      </p>
    `;
  } else if (r.status === 'correct') {
    summaryEl.innerHTML = `
      <p>${t('Your current pension matches our calculation within the rounding tolerance of Rs. 100. No shortfall detected.', 'آپ کی موجودہ پنشن ہمارے حساب سے 100 روپے کی حد میں ملتی ہے۔ کوئی کمی نہیں ملی۔')}</p>
    `;
  } else {
    summaryEl.innerHTML = `
      <p>${t('Our calculation shows your pension may be higher than expected. Please verify with CMA directly.', 'ہمارا حساب ظاہر کرتا ہے کہ آپ کی پنشن توقع سے زیادہ ہو سکتی ہے۔ براہ کرم CMA سے براہ راست تصدیق کریں۔')}</p>
    `;
  }

  // Restoration warning in result
  const restoEl = document.getElementById('restorationResult');
  if (r.meta.commuted && r.estRestoreYear) {
    restoEl.classList.remove('hidden');
    const restoreStr = `${monthName(r.estRestoreMonth, lang)} ${r.estRestoreYear}`;
    if (!r.meta.restored) {
      restoEl.innerHTML = `⚠️ ${t(`Restoration estimated due: ${restoreStr}. If not restored, this is an additional source of arrears.`, `بحالی کی تخمینی تاریخ: ${restoreStr}۔ اگر بحال نہیں ہوئی تو یہ بقایا جات کا اضافی ذریعہ ہے۔`)}`;
    } else if (r.restorationDelay && r.restorationDelay.delayMonths > 0) {
      restoEl.innerHTML = `⚠️ ${t(`Restoration was delayed by ${r.restorationDelay.delayMonths} months. Estimated arrears: ${formatRs(r.restorationDelay.arrears)}`, `بحالی ${r.restorationDelay.delayMonths} ماہ دیر سے ہوئی۔ تخمینی بقایا جات: ${formatRs(r.restorationDelay.arrears)}`)}`;
    } else {
      restoEl.classList.add('hidden');
    }
  }

  resultSec.scrollIntoView({ behavior: 'smooth' });
}

// ── PDF trigger (Phase 1 — manual payment) ────────────────
function generatePDF() {
  const instrEl = document.getElementById('paymentInstructions');
  instrEl.style.display = instrEl.style.display === 'none' ? 'block' : 'none';
  instrEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openWhatsApp() {
  const service  = document.getElementById('service').options[document.getElementById('service').selectedIndex].text;
  const rank     = document.getElementById('rank').options[document.getElementById('rank').selectedIndex].text;
  const retireYr = document.getElementById('retireYear').value;

  const msg = encodeURIComponent(
    `Salaam. I have completed the pension verification on FaujiPension.com.\n` +
    `Service: ${service} | Rank: ${rank} | Retired: ${retireYr}\n` +
    `Result: ${calcResult ? calcResult.status.toUpperCase() : ''} | ` +
    `Shortfall: ${calcResult ? formatRs(calcResult.monthlyShortfall) : 'N/A'}/month\n` +
    `I am sending Rs. 500 via JazzCash. Please send my PDF report.`
  );
  window.open(`https://wa.me/923000000000?text=${msg}`, '_blank');
}

function shareWhatsApp() {
  const msg = encodeURIComponent(
    `I checked my military pension on FaujiPension.com and found a shortfall of ` +
    `${calcResult ? formatRs(calcResult.monthlyShortfall) : ''}/month. ` +
    `Check yours free at [website URL]`
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function startOver() {
  document.getElementById('resultSection').classList.add('hidden');
  document.querySelector('.tool-section').style.display = '';
  goToStep(1);
  calcResult = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Pension History Table ──────────────────────────────────
function buildHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '';

  const rows = [
    { year: 1993, rate: null, ref: t('Base year — no increase notification', 'بنیادی سال — کوئی اضافہ نہیں') },
    ...Object.entries(PENSION_RATES).map(([y, r]) => ({
      year: parseInt(y), rate: r,
      ref: RATE_REFERENCES[parseInt(y)] || t('Finance Division OM', 'فنانس ڈویژن اوایم')
    }))
  ];

  rows.sort((a, b) => a.year - b.year);

  rows.forEach(row => {
    const tr = document.createElement('tr');
    const rateDisplay = row.rate === null
      ? `<span class="rate-zero">—</span>`
      : row.rate === 0
        ? `<span class="rate-zero">${t('0% — No increase', '0% — کوئی اضافہ نہیں')}</span>`
        : `<span class="rate-positive">${(row.rate * 100).toFixed(1)}%</span>`;

    tr.innerHTML = `
      <td>${row.year}</td>
      <td>${rateDisplay}</td>
      <td style="font-size:.8rem;color:#6b7280">${row.ref}</td>
    `;
    tbody.appendChild(tr);
  });
}
