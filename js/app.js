/**
 * FaujiPension — Main application logic
 * Handles: bilingual UI, multi-step form, validation, result display, PDF trigger
 */

// ── State ──────────────────────────────────────────────────
let lang = 'en';
let currentStep = 1;
let calcResult = null;

// ── Rank data ──────────────────────────────────────────────
const RANKS = {
  soldier: [
    { val: 'sepoy',      en: 'Sepoy',          ur: 'سپاہی' },
    { val: 'lance_naik', en: 'Lance Naik',      ur: 'لانس نائیک' },
    { val: 'naik',       en: 'Naik',            ur: 'نائیک' },
    { val: 'havildar',   en: 'Havildar',        ur: 'حوالدار' },
    { val: 'lance_hav',  en: 'Lance Havildar',  ur: 'لانس حوالدار' }
  ],
  jco: [
    { val: 'naib_sub',  en: 'Naib Subedar',  ur: 'نائب صوبیدار' },
    { val: 'subedar',   en: 'Subedar',        ur: 'صوبیدار' },
    { val: 'sub_major', en: 'Subedar Major',  ur: 'صوبیدار میجر' }
  ],
  officer: [
    { val: '2lt',     en: 'Second Lieutenant',  ur: 'سیکنڈ لیفٹیننٹ' },
    { val: 'lt',      en: 'Lieutenant',         ur: 'لیفٹیننٹ' },
    { val: 'capt',    en: 'Captain',            ur: 'کیپٹن' },
    { val: 'major',   en: 'Major',              ur: 'میجر' },
    { val: 'lt_col',  en: 'Lieutenant Colonel', ur: 'لیفٹیننٹ کرنل' },
    { val: 'col',     en: 'Colonel',            ur: 'کرنل' },
    { val: 'brig',    en: 'Brigadier',          ur: 'بریگیڈیئر' },
    { val: 'maj_gen', en: 'Major General',      ur: 'میجر جنرل' }
  ]
};

const MONTHS_OPTIONS = [
  { val:'1',  en:'January',   ur:'جنوری' },
  { val:'2',  en:'February',  ur:'فروری' },
  { val:'3',  en:'March',     ur:'مارچ' },
  { val:'4',  en:'April',     ur:'اپریل' },
  { val:'5',  en:'May',       ur:'مئی' },
  { val:'6',  en:'June',      ur:'جون' },
  { val:'7',  en:'July',      ur:'جولائی' },
  { val:'8',  en:'August',    ur:'اگست' },
  { val:'9',  en:'September', ur:'ستمبر' },
  { val:'10', en:'October',   ur:'اکتوبر' },
  { val:'11', en:'November',  ur:'نومبر' },
  { val:'12', en:'December',  ur:'دسمبر' }
];

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMonthDropdowns();
  initYearDropdowns();
  buildHistoryTable();
  applyLang();

  document.getElementById('category').addEventListener('change', updateRanks);
  document.getElementById('langToggle').addEventListener('click', toggleLang);
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

  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`) || el.getAttribute('data-en');
  });
  document.querySelectorAll('option[data-en]').forEach(opt => {
    opt.textContent = opt.getAttribute(`data-${lang}`) || opt.getAttribute('data-en');
  });

  document.querySelector('.lang-en').classList.toggle('active-lang', lang === 'en');
  document.querySelector('.lang-ur').classList.toggle('active-lang', lang === 'ur');

  updateRanks();
  rebuildMonthDropdowns();
  buildHistoryTable();
}

function t(enText, urText) { return lang === 'ur' ? urText : enText; }

// ── Month / Year dropdowns ─────────────────────────────────
const MONTH_DROPDOWN_IDS = ['retireMonth', 'restoreMonth', 'veteranRetireMonth'];

function initMonthDropdowns() {
  MONTH_DROPDOWN_IDS.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${t('Month', 'مہینہ')}</option>`;
    MONTHS_OPTIONS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.val;
      opt.setAttribute('data-en', m.en);
      opt.setAttribute('data-ur', m.ur);
      opt.textContent = m[lang] || m.en;
      sel.appendChild(opt);
    });
  });
}

function rebuildMonthDropdowns() {
  MONTH_DROPDOWN_IDS.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.querySelectorAll('option[data-en]').forEach(opt => {
      opt.textContent = opt.getAttribute(`data-${lang}`) || opt.getAttribute('data-en');
    });
    sel.value = cur;
  });
}

function initYearDropdowns() {
  const currentYear = new Date().getFullYear();
  ['retireYear', 'restoreYear', 'veteranRetireYear'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${t('Year', 'سال')}</option>`;
    for (let y = currentYear - 1; y >= 1960; y--) {
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

// ── Pensioner type ─────────────────────────────────────────
function onPensionerTypeChange(val) {
  const isFamily = val === 'family';
  document.querySelector('.family-hint').classList.toggle('hidden', !isFamily);
  document.getElementById('primaryStep2').classList.toggle('hidden', isFamily);
  document.getElementById('familyStep2').classList.toggle('hidden', !isFamily);

  // Update Step 1 date label
  const lbl = document.querySelector('.retire-date-label');
  if (lbl) {
    const enTxt = isFamily ? 'Date of Death / Family Pension Start' : 'Date of Retirement';
    const urTxt = isFamily ? 'وفات کی تاریخ / خاندانی پنشن شروع' : 'ریٹائرمنٹ کی تاریخ';
    lbl.setAttribute('data-en', enTxt);
    lbl.setAttribute('data-ur', urTxt);
    lbl.textContent = t(enTxt, urTxt);
  }
}

// ── Family verification mode toggle ───────────────────────
function onFamilyModeChange(val) {
  const isTwoPhase = val === 'twoPhase';
  document.getElementById('veteranDetailsSection').classList.toggle('hidden', !isTwoPhase);
  document.getElementById('familyGrantSection').classList.toggle('hidden', isTwoPhase);
}

// ── Retirement year change — update commutation cap ────────
function onRetireYearChange() {
  updateCommutationCap();
}

function updateCommutationCap() {
  const retireYear  = parseInt(document.getElementById('retireYear').value) || 0;
  const retireMonth = parseInt(document.getElementById('retireMonth').value) || 1;
  const opt50 = document.getElementById('opt50pct');
  const note  = document.getElementById('commutationCapNote');
  if (!opt50 || !retireYear) return;

  const maxPct = maxCommutationPct(retireYear, retireMonth);
  if (maxPct < 0.50) {
    opt50.disabled = true;
    opt50.style.color = '#9ca3af';
    if (document.getElementById('commutedPct').value === '0.50') {
      document.getElementById('commutedPct').value = '0.35';
    }
    if (note) {
      note.textContent = t(
        'Maximum commutation for your retirement date is 35% (Finance Division circular 07-07-2015).',
        'آپ کی ریٹائرمنٹ کی تاریخ کے لیے زیادہ سے زیادہ کمیوٹیشن 35% ہے (فنانس ڈویژن سرکلر 07-07-2015)۔'
      );
    }
  } else {
    opt50.disabled = false;
    opt50.style.color = '';
    if (note) note.textContent = '';
  }
  calcCommutedAmount();
}

// ── Commutation helpers ────────────────────────────────────
function toggleCommutation(val) {
  document.getElementById('commutationSection').classList.toggle('hidden', val !== 'yes');
  if (val === 'yes') calcCommutedAmount();
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

// ── Step 4 setup ───────────────────────────────────────────
function setupStep4() {
  const pensionerType = document.querySelector('input[name="pensionerType"]:checked').value;
  const commuted      = document.querySelector('input[name="commuted"]:checked').value === 'yes';
  const isFamily      = pensionerType === 'family';

  const noNote   = document.getElementById('noCommutationNote');
  const restoSec = document.getElementById('restorationSection');
  const noText   = document.getElementById('noCommutationText');

  const showResto = commuted && !isFamily;
  noNote.classList.toggle('hidden', showResto);
  restoSec.classList.toggle('hidden', !showResto);

  if (!showResto) {
    noText.textContent = isFamily
      ? t('Family pension — commutation and restoration do not apply.', 'خاندانی پنشن — کمیوٹیشن اور بحالی لاگو نہیں ہوتی۔')
      : t('No commutation selected — restoration does not apply.', 'کمیوٹیشن نہیں کی گئی — بحالی لاگو نہیں ہوتی۔');
    return;
  }

  const retireMonth     = parseInt(document.getElementById('retireMonth').value) || 1;
  const retireYear      = parseInt(document.getElementById('retireYear').value) || 1990;
  const ageAtRetire     = parseInt(document.getElementById('ageAtRetirement').value) || 0;
  const restoredChecked = document.querySelector('input[name="restored"]:checked')?.value === 'yes';

  const phaseNotice = document.getElementById('restorationPhaseNotice');
  const estBox      = document.getElementById('estimatedRestorationBox');
  const estText     = document.getElementById('estimatedRestoreDateText');
  const warnBox     = document.getElementById('restorationWarning');
  const warnText    = document.getElementById('restorationWarningText');

  // Determine restoration legal phase
  const retireTotal    = retireYear * 12 + retireMonth;
  const cutoffTotal    = 2001 * 12 + 11; // Nov 2001
  const reinTotal      = 2015 * 12 + 7;  // Jul 2015

  let phaseMsg = '';
  if (retireTotal <= cutoffTotal) {
    phaseMsg = t(
      '✓ You retired on/before Nov 2001 — normal restoration rules apply (Finance Division OM Sep 2001).',
      '✓ آپ نومبر 2001 یا اس سے پہلے ریٹائر ہوئے — معمول کے بحالی قوانین لاگو ہیں۔'
    );
    phaseNotice.className = 'info-box accent';
  } else if (retireTotal < reinTotal) {
    phaseMsg = t(
      '⚠️ You retired Dec 2001 – Jun 2015. Restoration was WITHDRAWN by Finance Division OM No.1(5)-Imp/2001 (Sep 2001) and REINSTATED by Finance Division circular 07-07-2015. Your effective restoration date may be July 2015 or later.',
      '⚠️ آپ دسمبر 2001 تا جون 2015 کے درمیان ریٹائر ہوئے۔ بحالی فنانس ڈویژن او ایم (ستمبر 2001) کے تحت ختم کر دی گئی تھی اور 07-07-2015 کو دوبارہ بحال کی گئی۔'
    );
    phaseNotice.className = 'warning-box';
  } else {
    phaseMsg = t(
      '✓ You retired Jul 2015 or later — restoration reinstated for all federal pensioners (Finance Division circular 07-07-2015).',
      '✓ آپ جولائی 2015 یا بعد میں ریٹائر ہوئے — تمام وفاقی پنشنرز کے لیے بحالی بحال ہو گئی۔'
    );
    phaseNotice.className = 'info-box accent';
  }
  phaseNotice.textContent = phaseMsg;
  phaseNotice.classList.remove('hidden');

  // Show estimated restoration date
  if (ageAtRetire) {
    const restoInfo = getRestorationInfo(retireMonth, retireYear, ageAtRetire);
    if (restoInfo) {
      const effStr  = `${monthName(restoInfo.month, lang)} ${restoInfo.year}`;
      const calcStr = `${monthName(restoInfo.calcDate.month, lang)} ${restoInfo.calcDate.year}`;

      let estMsg = '';
      if (restoInfo.rule === 'reinstated_2015' && restoInfo.lateMonths > 0) {
        estMsg = t(
          `Calculated restoration: ${calcStr}. But restoration was withdrawn (Sep 2001 OM), so effective date is ${effStr} (July 2015 reinstatement). ${restoInfo.lateMonths} months of arrears may be owed.`,
          `حساب کردہ بحالی: ${calcStr}۔ لیکن بحالی ختم کر دی گئی تھی، اس لیے موثر تاریخ ${effStr} ہے (جولائی 2015 بحالی)۔ ${restoInfo.lateMonths} ماہ کے بقایا واجب ہو سکتے ہیں۔`
        );
      } else {
        estMsg = t(
          `Estimated restoration date: ${effStr} (based on commutation table for age ${ageAtRetire}).`,
          `تخمینی بحالی کی تاریخ: ${effStr} (عمر ${ageAtRetire} کے لیے کمیوٹیشن ٹیبل کی بنیاد پر)۔`
        );
      }
      estText.textContent = estMsg;
      estBox.classList.remove('hidden');

      // Warn if restoration should have passed and not yet restored
      const now    = new Date();
      const effTot = restoInfo.year * 12 + restoInfo.month;
      const nowTot = now.getFullYear() * 12 + (now.getMonth() + 1);

      if (effTot <= nowTot && !restoredChecked) {
        warnText.textContent = t(
          `⚠️ Restoration was due by ${effStr}. If not yet restored, you may be owed significant arrears. This will be detailed in your full report.`,
          `⚠️ بحالی ${effStr} تک ہونی چاہیے تھی۔ اگر ابھی تک بحال نہیں ہوئی، تو آپ کو کافی بقایا جات مل سکتے ہیں۔`
        );
        warnBox.classList.remove('hidden');
      } else {
        warnBox.classList.add('hidden');
      }
    }
  } else {
    estBox.classList.add('hidden');
  }
}

// ── Step navigation ────────────────────────────────────────
function nextStep(from) {
  if (!validateStep(from)) return;
  // Skip Step 3 commutation for family pension
  if (from === 2) {
    const isFamily = document.querySelector('input[name="pensionerType"]:checked').value === 'family';
    if (isFamily) { goToStep(3); setupStep3Family(); setupStep4(); goToStep(4); return; }
  }
  goToStep(from + 1);
  if (from + 1 === 3) setupStep3();
  if (from + 1 === 4) setupStep4();
}

function prevStep(from) {
  const isFamily = document.querySelector('input[name="pensionerType"]:checked').value === 'family';
  if (from === 4 && isFamily) { goToStep(2); return; }
  goToStep(from - 1);
}

function setupStep3() {
  const isFamily = document.querySelector('input[name="pensionerType"]:checked').value === 'family';
  document.getElementById('familyCommutationNotice').classList.toggle('hidden', !isFamily);
  document.getElementById('commutationFields').classList.toggle('hidden', isFamily);
  updateCommutationCap();
}

function setupStep3Family() {
  document.getElementById('familyCommutationNotice').classList.remove('hidden');
  document.getElementById('commutationFields').classList.add('hidden');
}

function goToStep(n) {
  document.getElementById(`step${currentStep}`).classList.remove('active');
  currentStep = n;
  document.getElementById(`step${currentStep}`).classList.add('active');
  document.getElementById('progressBar').style.width = `${(n / 4) * 100}%`;

  document.querySelectorAll('.step-dot').forEach(dot => {
    const s = parseInt(dot.getAttribute('data-step'));
    dot.classList.remove('active', 'done');
    if (s === n)  dot.classList.add('active');
    if (s < n)    dot.classList.add('done');
  });

  window.scrollTo({ top: document.getElementById('tool').offsetTop - 70, behavior: 'smooth' });
}

// ── Validation ─────────────────────────────────────────────
function validateStep(step) {
  const errEl = document.getElementById(`step${step}Error`);
  errEl.classList.add('hidden');
  errEl.textContent = '';
  const err = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); return false; };

  if (step === 1) {
    if (!document.getElementById('service').value)
      return err(t('Please select your service branch.', 'براہ کرم اپنی فوجی شاخ منتخب کریں۔'));
    if (!document.getElementById('category').value)
      return err(t('Please select your category.', 'براہ کرم اپنا درجہ منتخب کریں۔'));
    if (!document.getElementById('rank').value)
      return err(t('Please select your rank.', 'براہ کرم اپنا رینک منتخب کریں۔'));
    if (!document.getElementById('retireMonth').value || !document.getElementById('retireYear').value)
      return err(t('Please enter your retirement month and year.', 'براہ کرم ریٹائرمنٹ کا مہینہ اور سال درج کریں۔'));
    if (parseInt(document.getElementById('retireYear').value) > new Date().getFullYear())
      return err(t('Retirement date cannot be in the future.', 'ریٹائرمنٹ کی تاریخ مستقبل میں نہیں ہو سکتی۔'));
  }

  if (step === 2) {
    const pensionerType = document.querySelector('input[name="pensionerType"]:checked').value;
    const isFamily = pensionerType === 'family';

    if (isFamily) {
      const mode = document.querySelector('input[name="familyVerifyMode"]:checked').value;
      if (mode === 'twoPhase') {
        if (!document.getElementById('veteranRetireMonth').value || !document.getElementById('veteranRetireYear').value)
          return err(t("Please enter the veteran's date of military retirement.", 'براہ کرم سابق فوجی کی فوجی ریٹائرمنٹ کی تاریخ درج کریں۔'));
        const vgp = parseFloat(document.getElementById('veteranGrossPension').value);
        if (!vgp || vgp <= 0)
          return err(t("Please enter the veteran's gross pension at retirement.", 'براہ کرم سابق فوجی کی مجموعی پنشن درج کریں۔'));
        const vetYear  = parseInt(document.getElementById('veteranRetireYear').value);
        const deathYear = parseInt(document.getElementById('retireYear').value);
        if (vetYear >= deathYear)
          return err(t("Veteran's retirement date must be before the death / family pension start date (Step 1).", 'سابق فوجی کی ریٹائرمنٹ کی تاریخ وفات / خاندانی پنشن شروع (مرحلہ 1) سے پہلے ہونی چاہیے۔'));
      }
    } else {
      const knowPension = document.querySelector('input[name="knowPension"]:checked').value;
      if (knowPension === 'yes') {
        const gp = parseFloat(document.getElementById('grossPension').value);
        if (!gp || gp <= 0)
          return err(t('Please enter your gross pension at retirement.', 'براہ کرم ریٹائرمنٹ پر مجموعی پنشن درج کریں۔'));
      } else {
        const cp = parseFloat(document.getElementById('currentPensionAlt').value);
        if (!cp || cp <= 0)
          return err(t('Please enter your current pension for reverse calculation.', 'براہ کرم الٹا حساب کے لیے موجودہ پنشن درج کریں۔'));
      }
    }

    const cp = parseFloat(document.getElementById('currentPension').value);
    if (!cp || cp <= 0)
      return err(t('Please enter your current pension being drawn.', 'براہ کرم موجودہ ماہانہ پنشن درج کریں۔'));
  }

  if (step === 3) {
    const isFamily = document.querySelector('input[name="pensionerType"]:checked').value === 'family';
    if (!isFamily) {
      const commuted = document.querySelector('input[name="commuted"]:checked').value === 'yes';
      if (commuted) {
        const ca = parseFloat(document.getElementById('commutedAmount').value);
        if (!ca || ca <= 0)
          return err(t('Please enter the commuted monthly amount.', 'براہ کرم کمیوٹ شدہ ماہانہ رقم درج کریں۔'));
        const gp = parseFloat(document.getElementById('grossPension').value) || 0;
        if (gp > 0 && ca >= gp)
          return err(t('Commuted amount cannot be equal to or greater than gross pension.', 'کمیوٹ شدہ رقم مجموعی پنشن سے زیادہ یا برابر نہیں ہو سکتی۔'));
      }
    }
  }

  return true;
}

// ── Calculate ──────────────────────────────────────────────
function calculate() {
  if (!validateStep(4)) return;

  const pensionerType = document.querySelector('input[name="pensionerType"]:checked').value;
  const isFamily      = pensionerType === 'family';

  // Step 1 date: for family = death/grant date; for primary = retirement date
  const step1Month = parseInt(document.getElementById('retireMonth').value);
  const step1Year  = parseInt(document.getElementById('retireYear').value);

  const currentPension   = parseFloat(document.getElementById('currentPension').value);
  const medicalAllowance = parseFloat(document.getElementById('medicalAllowance').value) || 0;

  let retireMonth, retireYear, grossPension;
  let deathMonth = null, deathYear = null;
  let familyPensionPct = 0.50;
  let familyMode = null;
  let knowPension = 'yes';

  if (isFamily) {
    familyMode       = document.querySelector('input[name="familyVerifyMode"]:checked').value;
    familyPensionPct = parseFloat(document.getElementById('familyPensionPct').value) || 0.50;

    if (familyMode === 'twoPhase') {
      // Two-phase: veteran's military retirement date from Step 2
      retireMonth  = parseInt(document.getElementById('veteranRetireMonth').value);
      retireYear   = parseInt(document.getElementById('veteranRetireYear').value);
      grossPension = parseFloat(document.getElementById('veteranGrossPension').value);
      deathMonth   = step1Month;
      deathYear    = step1Year;
    } else {
      // Single-phase: death/grant date is the pension start
      retireMonth = step1Month;
      retireYear  = step1Year;
      const grantAmt = parseFloat(document.getElementById('familyPensionGrant').value);
      if (grantAmt > 0) {
        grossPension = grantAmt;
        knowPension  = 'yes';
      } else {
        grossPension = estimateGrossFromCurrent(currentPension, retireYear, retireMonth);
        knowPension  = 'no';
      }
    }
  } else {
    retireMonth = step1Month;
    retireYear  = step1Year;
    knowPension = document.querySelector('input[name="knowPension"]:checked').value;
    if (knowPension === 'yes') {
      grossPension = parseFloat(document.getElementById('grossPension').value);
    } else {
      grossPension = estimateGrossFromCurrent(
        parseFloat(document.getElementById('currentPensionAlt').value),
        retireYear, retireMonth
      );
    }
  }

  // Commutation (primary only)
  const commuted       = !isFamily && document.querySelector('input[name="commuted"]:checked').value === 'yes';
  const commutedPct    = commuted ? parseFloat(document.getElementById('commutedPct').value) : 0;
  const commutedAmount = commuted ? (parseFloat(document.getElementById('commutedAmount').value) || grossPension * commutedPct) : 0;
  const ageAtRetirement= commuted ? (parseInt(document.getElementById('ageAtRetirement').value) || null) : null;

  // Restoration (primary commuted only)
  const restoredField = document.querySelector('input[name="restored"]:checked');
  const restored      = commuted && restoredField && restoredField.value === 'yes';
  const restoreMonth  = restored ? (parseInt(document.getElementById('restoreMonth').value) || null) : null;
  const restoreYear   = restored ? (parseInt(document.getElementById('restoreYear').value)  || null) : null;

  calcResult = calculatePension({
    pensionerType,
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
    medicalAllowance,
    deathYear,
    deathMonth,
    familyPensionPct
  });

  // Metadata for display and PDF
  calcResult.meta = {
    pensionerType,
    familyMode,
    familyPensionPct,
    deathMonth, deathYear,
    service:  document.getElementById('service').value,
    category: document.getElementById('category').value,
    rank:     document.getElementById('rank').value,
    serviceLabel:  document.getElementById('service').options[document.getElementById('service').selectedIndex]?.text,
    categoryLabel: document.getElementById('category').options[document.getElementById('category').selectedIndex]?.text,
    rankLabel:     document.getElementById('rank').options[document.getElementById('rank').selectedIndex]?.text,
    retireMonth, retireYear,
    knowPension, commuted, commutedPct, ageAtRetirement,
    restored, restoreMonth, restoreYear,
    medicalAllowance
  };

  showResult(calcResult);
}

// Reverse-calculate gross pension by un-applying all increases from retirement year
function estimateGrossFromCurrent(currentPension, retireYear, retireMonth) {
  const CURRENT_YEAR = 2026;
  let p = currentPension;
  for (let year = CURRENT_YEAR; year > retireYear; year--) {
    const rate = PENSION_RATES[year] ?? 0;
    if (rate > 0) p = p / (1 + rate);
  }
  return Math.round(p);
}

// ── Display Result ─────────────────────────────────────────
function showResult(r) {
  document.getElementById('tool').closest('section').style.display = 'none';
  const resultSec = document.getElementById('resultSection');
  resultSec.classList.remove('hidden');

  const m = r.meta;

  // Header
  const typeLabel = m.pensionerType === 'family'
    ? t('Family Pension', 'خاندانی پنشن')
    : m.categoryLabel || m.category;
  document.getElementById('resultService').textContent = `${m.serviceLabel} — ${m.rankLabel} (${typeLabel})`;
  let retireLabel;
  if (r.twoPhase) {
    retireLabel = `${t('Veteran retired:', 'سابق فوجی ریٹائر:')} ${monthName(m.retireMonth, lang)} ${m.retireYear}` +
                  ` · ${t('Family pension from:', 'خاندانی پنشن سے:')} ${monthName(m.deathMonth, lang)} ${m.deathYear}`;
  } else {
    retireLabel = `${t('Retired/Started:', 'ریٹائرڈ/شروع:')} ${monthName(m.retireMonth, lang)} ${m.retireYear}`;
  }
  document.getElementById('resultRetire').textContent = retireLabel;

  // Verdict
  const vBox  = document.getElementById('verdictBox');
  const vIcon = document.getElementById('verdictIcon');
  const vTit  = document.getElementById('verdictTitle');
  const vAmt  = document.getElementById('verdictAmounts');

  vBox.className = 'verdict-box verdict-' + r.status;

  const amountHTML = (label, value, cls = '') => `
    <div class="verdict-amount-item${cls ? ' ' + cls : ''}">
      <div class="amount-label">${label}</div>
      <div class="amount-value${cls.includes('highlight') ? (cls.includes('red') ? ' red' : ' green') : ''}">${value}</div>
    </div>`;

  if (r.status === 'underpaid') {
    vIcon.textContent = '⚠️';
    vTit.textContent  = t('POSSIBLY UNDERPAID', 'ممکنہ طور پر کم ادائیگی');
    vAmt.innerHTML    =
      amountHTML(t('Drawn','مل رہا'), formatRs(r.currentPension)) +
      amountHTML(t('Calculated','حساب'), formatRs(r.correctPension), 'highlight-green') +
      amountHTML(t('Shortfall/mo','کمی/ماہ'), formatRs(r.monthlyShortfall), 'highlight-red');
  } else if (r.status === 'correct') {
    vIcon.textContent = '✅';
    vTit.textContent  = t('PENSION APPEARS CORRECT', 'پنشن درست معلوم ہوتی ہے');
    vAmt.innerHTML    =
      amountHTML(t('Drawn','مل رہا'), formatRs(r.currentPension)) +
      amountHTML(t('Calculated','حساب'), formatRs(r.correctPension), 'highlight-green') +
      amountHTML(t('Difference','فرق'), formatRs(Math.abs(r.difference)));
  } else {
    vIcon.textContent = '🔍';
    vTit.textContent  = t('POSSIBLE OVERPAYMENT — VERIFY', 'ممکنہ زیادہ ادائیگی — تصدیق کریں');
    vAmt.innerHTML    =
      amountHTML(t('Drawn','مل رہا'), formatRs(r.currentPension)) +
      amountHTML(t('Calculated','حساب'), formatRs(r.correctPension)) +
      amountHTML(t('Excess/mo','زیادہ/ماہ'), formatRs(Math.abs(r.difference)));
  }

  // Summary
  const summaryEl = document.getElementById('resultSummary');
  if (r.status === 'underpaid') {
    summaryEl.innerHTML = `
      <p><strong>${t('Estimated annual shortfall:','تخمینی سالانہ کمی:')}</strong> ${formatRs(r.annualShortfall)}</p>
      ${r.medicalAllowance > 0 ? `<p style="margin-top:6px;font-size:.85rem;color:#6b7280">${t(`Medical allowance of ${formatRs(r.medicalAllowance)}/mo excluded from increase base per Finance Division OMs.`,`طبی الاؤنس ${formatRs(r.medicalAllowance)}/ماہ فنانس ڈویژن او ایم کے مطابق اضافہ بیس سے خارج کیا گیا۔`)}</p>` : ''}
      <p style="margin-top:8px;font-size:.85rem;color:#6b7280">${t('The full report includes the year-by-year trail, official rate references, and a CMA submission letter.','مکمل رپورٹ میں سال بہ سال حساب، سرکاری حوالہ جات، اور CMA کو باقاعدہ خط شامل ہے۔')}</p>`;
  } else if (r.status === 'correct') {
    summaryEl.innerHTML = `<p>${t('Your current pension matches our calculation within the rounding tolerance of Rs. 100.','آپ کی موجودہ پنشن 100 روپے کی حد میں ہمارے حساب سے ملتی ہے۔')}</p>`;
  } else {
    summaryEl.innerHTML = `<p>${t('Your pension appears higher than calculated. Please verify with CMA directly.','آپ کی پنشن حساب سے زیادہ معلوم ہوتی ہے۔ براہ کرم CMA سے براہ راست تصدیق کریں۔')}</p>`;
  }

  // Two-phase result block
  const tpEl = document.getElementById('twoPhaseResult');
  tpEl.classList.add('hidden');
  if (r.twoPhase) {
    tpEl.classList.remove('hidden');
    const pct = (r.familyPensionPct * 100).toFixed(0);
    const deathStr = `${monthName(r.phase2Trail[0].month, lang)} ${r.phase2Trail[0].year}`;
    tpEl.innerHTML = `
      <h3 style="margin:0 0 10px;font-size:1rem;color:#0f7b4f">${t('Two-Phase Calculation Summary', 'دو مرحلہ حساب کا خلاصہ')}</h3>
      <div class="two-phase-grid">
        <div class="tp-item">
          <span class="tp-label">${t("Veteran's pension at death", 'سابق فوجی کی پنشن بوقت وفات')}</span>
          <span class="tp-value">${formatRs(r.veteranPensionAtDeath)}</span>
        </div>
        <div class="tp-item">
          <span class="tp-label">${t('Family pension at grant', 'منظوری پر خاندانی پنشن')} (${pct}%)</span>
          <span class="tp-value">${formatRs(r.familyPensionStart)}</span>
        </div>
        <div class="tp-item tp-highlight">
          <span class="tp-label">${t('Calculated family pension today', 'آج کی حساب کردہ خاندانی پنشن')}</span>
          <span class="tp-value tp-green">${formatRs(r.correctPension)}</span>
        </div>
      </div>
      ${r.pre1994Warning ? `<p class="warning-inline"><strong>⚠️</strong> ${t('Veteran retired before 1994 — Finance Division OMs before 1994 are not on official record. Pre-1994 years treated as 0% increase (conservative).', 'سابق فوجی 1994 سے پہلے ریٹائر ہوئے — 1994 سے پہلے کی فنانس ڈویژن شرحیں سرکاری ریکارڈ پر نہیں — 0% فرض کی گئیں (محتاط تخمینہ)۔')}</p>` : ''}
    `;
  }

  // Restoration result block
  const restoEl = document.getElementById('restorationResult');
  restoEl.classList.add('hidden');

  if (m.commuted && r.restoInfo) {
    const effStr = `${monthName(r.restoInfo.month, lang)} ${r.restoInfo.year}`;
    let msg = '';

    if (r.restoInfo.rule === 'reinstated_2015' && r.restoInfo.lateMonths > 0 && !m.restored) {
      msg = t(
        `⚠️ Your calculated restoration date was ${monthName(r.restoInfo.calcDate.month, lang)} ${r.restoInfo.calcDate.year}, but due to Finance Division OM (Sep 2001) the restoration was withdrawn. It was reinstated in July 2015 — ${r.restoInfo.lateMonths} months later. If not yet restored, significant arrears are owed.`,
        `⚠️ آپ کی حساب کردہ بحالی کی تاریخ ${monthName(r.restoInfo.calcDate.month, lang)} ${r.restoInfo.calcDate.year} تھی، لیکن فنانس ڈویژن او ایم (ستمبر 2001) کی وجہ سے بحالی ختم کر دی گئی تھی۔ جولائی 2015 میں بحال کی گئی — ${r.restoInfo.lateMonths} ماہ بعد۔`
      );
      restoEl.classList.remove('hidden');
    } else if (!m.restored) {
      const now    = new Date();
      const effTot = r.restoInfo.year * 12 + r.restoInfo.month;
      const nowTot = now.getFullYear() * 12 + (now.getMonth() + 1);
      if (effTot <= nowTot) {
        msg = t(
          `⚠️ Restoration was due in ${effStr}. If not yet restored, you may be owed arrears.`,
          `⚠️ بحالی ${effStr} میں واجب تھی۔ اگر ابھی تک بحال نہیں ہوئی تو بقایا جات واجب ہو سکتے ہیں۔`
        );
        restoEl.classList.remove('hidden');
      }
    } else if (r.restorationDelay && r.restorationDelay.delayMonths > 0) {
      msg = t(
        `⚠️ Restoration was delayed by ${r.restorationDelay.delayMonths} months. Estimated arrears from delay: ${formatRs(r.restorationDelay.arrears)}.`,
        `⚠️ بحالی ${r.restorationDelay.delayMonths} ماہ دیر سے ہوئی۔ تاخیر سے تخمینی بقایا: ${formatRs(r.restorationDelay.arrears)}۔`
      );
      restoEl.classList.remove('hidden');
    }

    if (msg) restoEl.textContent = msg;
  }

  resultSec.scrollIntoView({ behavior: 'smooth' });
}

// ── PDF trigger ────────────────────────────────────────────
function generatePDF() {
  const instrEl = document.getElementById('paymentInstructions');
  instrEl.style.display = instrEl.style.display === 'none' ? 'block' : 'none';
  instrEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openWhatsApp() {
  const m   = calcResult?.meta || {};
  const msg = encodeURIComponent(
    `Salaam. I completed pension verification on FaujiPension.com.\n` +
    `Service: ${m.serviceLabel} | Rank: ${m.rankLabel} | Retired: ${m.retireYear}\n` +
    `Type: ${m.pensionerType === 'family' ? 'Family Pension' : 'Primary'}\n` +
    `Result: ${calcResult ? calcResult.status.toUpperCase() : ''} | ` +
    `Shortfall: ${calcResult ? formatRs(calcResult.monthlyShortfall) : 'N/A'}/month\n` +
    `Sending Rs. 500 via JazzCash. Please send my PDF report.`
  );
  window.open(`https://wa.me/923000000000?text=${msg}`, '_blank');
}

function shareWhatsApp() {
  const msg = encodeURIComponent(
    `I checked my military pension on FaujiPension.com and found: ` +
    `${calcResult ? calcResult.status.toUpperCase() : ''}. ` +
    `${calcResult && calcResult.monthlyShortfall > 0 ? 'Shortfall: ' + formatRs(calcResult.monthlyShortfall) + '/month.' : ''} ` +
    `Check yours free!`
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function startOver() {
  document.getElementById('resultSection').classList.add('hidden');
  document.querySelector('.tool-section').style.display = '';
  calcResult = null;
  goToStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── History Table ──────────────────────────────────────────
function buildHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const rows = [
    { year: 1993, rate: null, ref: t('Base year', 'بنیادی سال') },
    ...Object.entries(PENSION_RATES).map(([y, r]) => ({
      year: parseInt(y), rate: r,
      ref:  RATE_REFERENCES[parseInt(y)] || t('Finance Division OM', 'فنانس ڈویژن اوایم'),
      unconfirmed: UNCONFIRMED_YEARS.has(parseInt(y))
    }))
  ].sort((a, b) => a.year - b.year);

  rows.forEach(row => {
    const tr = document.createElement('tr');
    if (row.unconfirmed) tr.style.opacity = '0.7';

    const rateDisplay = row.rate === null
      ? `<span class="rate-zero">—</span>`
      : row.rate === 0
        ? `<span class="rate-zero">${t('0% — No increase','0% — کوئی اضافہ نہیں')}</span>`
        : `<span class="rate-positive">${(row.rate * 100).toFixed(1)}%</span>`;

    tr.innerHTML = `
      <td>${row.year}${row.unconfirmed ? ' <span title="Unconfirmed">⚠️</span>' : ''}</td>
      <td>${rateDisplay}</td>
      <td style="font-size:.8rem;color:#6b7280">${row.ref}</td>`;
    tbody.appendChild(tr);
  });
}

