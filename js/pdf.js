/**
 * PDF Report Generator — FaujiPension
 * Uses jsPDF (loaded from CDN). Generates a 5-6 page verification report.
 */

function generateFullPDF(result, meta) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 20, innerW = 170;

  const refNo = 'FP-' + Date.now().toString(36).toUpperCase();
  const today = new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'long', year:'numeric' });

  // ── Colour helpers ────────────────────────────────────────
  const setFill  = hex => doc.setFillColor(...hexRgb(hex));
  const setDraw  = hex => doc.setDrawColor(...hexRgb(hex));
  const setColor = hex => doc.setTextColor(...hexRgb(hex));
  function hexRgb(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }

  // ── Page header ───────────────────────────────────────────
  function pageHeader(pageNum) {
    setFill('#0f7b4f'); doc.rect(0,0,W,18,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    setColor('#ffffff');
    doc.text('PAKISTAN MILITARY PENSION VERIFICATION REPORT', margin, 11);
    doc.text(`Page ${pageNum}`, W-margin, 11, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.text(`Ref: ${refNo}`, margin, 16);
    doc.text(today, W-margin, 16, {align:'right'});
    setColor('#000000');
  }

  // ── Section title bar ─────────────────────────────────────
  function secTitle(text, y) {
    setFill('#0f7b4f'); doc.rect(margin, y, innerW, 7, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9.5);
    setColor('#ffffff'); doc.text(text, margin+3, y+5);
    setColor('#000000'); return y + 12;
  }

  // ── Two-column row ────────────────────────────────────────
  function dataRow(label, value, y, bgHex) {
    if (bgHex) { setFill(bgHex); doc.rect(margin, y-4, innerW, 7, 'F'); }
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    setColor('#6b7280'); doc.text(label, margin+2, y);
    doc.setFont('helvetica','bold');
    setColor(bgHex === '#e6f4ee' ? '#0f7b4f' : bgHex === '#fdf0ef' ? '#c0392b' : '#1f2937');
    doc.text(String(value), W-margin-2, y, {align:'right'});
    setColor('#000000'); return y + 7;
  }

  function hLine(y) {
    setDraw('#e5e7eb'); doc.setLineWidth(0.3);
    doc.line(margin, y, W-margin, y); return y+5;
  }

  const isFamily   = result.pensionerType === 'family';
  const isTwoPhase = result.twoPhase === true;
  const retireStr  = `${MONTHS_EN[(meta.retireMonth||1)-1]} ${meta.retireYear}`;
  const deathStr   = isTwoPhase ? `${MONTHS_EN[(meta.deathMonth||1)-1]} ${meta.deathYear}` : null;
  const typeLabel  = isFamily
    ? (isTwoPhase ? `Family Pension — ${(result.familyPensionPct*100).toFixed(0)}% (Two-Phase Verification)` : 'Family Pension (Widow/Dependent)')
    : `${meta.categoryLabel} — ${meta.rankLabel}`;

  // ══ PAGE 1 — COVER ════════════════════════════════════════
  pageHeader(1);

  doc.setFontSize(28); doc.text('⭐', W/2, 50, {align:'center'});
  doc.setFont('helvetica','bold'); doc.setFontSize(15);
  setColor('#0f7b4f');
  doc.text('PAKISTAN MILITARY PENSION', W/2, 64, {align:'center'});
  doc.text('VERIFICATION REPORT', W/2, 73, {align:'center'});
  setDraw('#c9a227'); doc.setLineWidth(1);
  doc.line(margin+20, 78, W-margin-20, 78);

  doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
  setColor('#1f2937');
  let y = 88;
  const coverRows = [
    ['Service:', meta.serviceLabel || ''],
    ['Type:', typeLabel],
    isTwoPhase
      ? ['Veteran Retired:', retireStr]
      : ['Retirement / Pension Start:', retireStr],
    ...(isTwoPhase ? [['Family Pension From:', deathStr]] : []),
    ['Reference No:', refNo],
    ['Generated:', today]
  ];
  coverRows.forEach(([l,v]) => {
    doc.setFont('helvetica','bold'); setColor('#6b7280'); doc.text(l, margin+10, y);
    doc.setFont('helvetica','normal'); setColor('#1f2937'); doc.text(v, margin+65, y);
    y += 9;
  });

  y += 6;
  const vBg  = result.status==='underpaid' ? '#fdf0ef' : result.status==='correct' ? '#e6f4ee' : '#fdf6e3';
  const vClr = result.status==='underpaid' ? '#c0392b' : result.status==='correct' ? '#0f7b4f' : '#c9a227';
  const vTxt = result.status==='underpaid' ? 'POSSIBLY UNDERPAID'
             : result.status==='correct'   ? 'PENSION APPEARS CORRECT'
             : 'VERIFY — POSSIBLE OVERPAYMENT';
  doc.setFillColor(...hexRgb(vBg));
  doc.roundedRect(margin+15, y, innerW-30, 16, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(12);
  setColor(vClr); doc.text(vTxt, W/2, y+10, {align:'center'});

  y += 26;
  doc.setFont('helvetica','italic'); doc.setFontSize(7.5); setColor('#6b7280');
  doc.text('Estimates based on official Finance Division OMs. Verify with CMA before legal action.', W/2, y, {align:'center'});

  // ══ PAGE 2 — SUMMARY ══════════════════════════════════════
  doc.addPage(); pageHeader(2); y = 26;
  y = secTitle('VERIFICATION SUMMARY', y);

  if (isTwoPhase) {
    y = dataRow("Veteran's Gross Pension at Retirement", formatRs(result.grossPension), y);
    y = dataRow("Veteran's Pension at Death / Grant Date", formatRs(result.veteranPensionAtDeath), y);
    y = dataRow(`Family Pension at Grant (${(result.familyPensionPct*100).toFixed(0)}%)`, formatRs(result.familyPensionStart), y, '#e6f4ee');
  } else {
    y = dataRow('Gross Pension at Start Date', formatRs(result.grossPension), y);
  }
  if (!isFamily && result.commutedAmount > 0) {
    y = dataRow('Commuted Monthly Amount', formatRs(result.commutedAmount), y);
    y = dataRow('Retained Pension (after commutation)', formatRs(result.retainedPension), y);
  }
  if (result.medicalAllowance > 0)
    y = dataRow('Medical Allowance (excluded from increase base)', formatRs(result.medicalAllowance), y);
  y = dataRow('Pension Currently Being Drawn', formatRs(result.currentPension), y);
  y = dataRow('Calculated Correct Pension (2026)', formatRs(result.correctPension), y, '#e6f4ee');
  if (result.status === 'underpaid') {
    y = dataRow('Monthly Shortfall', formatRs(result.monthlyShortfall), y, '#fdf0ef');
    y = dataRow('Estimated Annual Shortfall', formatRs(result.annualShortfall), y, '#fdf0ef');
  } else {
    y = dataRow('Difference (Calculated vs Drawn)', formatRs(Math.abs(result.difference)), y);
  }

  y = hLine(y+2);

  // Commutation summary
  if (!isFamily) {
    y = secTitle('COMMUTATION & RESTORATION', y);
    if (result.commutedAmount > 0) {
      y = dataRow('Commuted %', `${(meta.commutedPct*100).toFixed(0)}%`, y);
      y = dataRow('Commuted Monthly Amount', formatRs(result.commutedAmount), y);
      if (result.lumpSumCalc)
        y = dataRow('Lump Sum Receivable (calculated)', formatRs(result.lumpSumCalc), y);

      if (result.restoInfo) {
        const ri = result.restoInfo;
        const effStr  = `${MONTHS_EN[ri.month-1]} ${ri.year}`;
        const calcStr = `${MONTHS_EN[ri.calcDate.month-1]} ${ri.calcDate.year}`;
        y = dataRow('Calculated Restoration Date', calcStr, y);
        y = dataRow('Effective Restoration Date', effStr, y, '#e6f4ee');

        const phaseLabel = ri.rule === 'pre2001'   ? 'Phase 1 — Pre-Nov 2001 (normal rules)'
                         : ri.rule.includes('reinstated') ? 'Phase 2 — Post-2001 (reinstated Jul 2015)'
                         : 'Phase 3 — Post-Jul 2015 (normal rules)';
        y = dataRow('Restoration Legal Phase', phaseLabel, y);

        if (ri.rule === 'reinstated_2015' && ri.lateMonths > 0)
          y = dataRow('Months Delayed (Sep 2001 OM withdrawal)', ri.lateMonths + ' months', y, '#fdf0ef');
        if (result.restorationDelay && result.restorationDelay.delayMonths > 0)
          y = dataRow('Late Restoration Arrears', formatRs(result.restorationDelay.arrears), y, '#fdf0ef');
      }
    } else {
      y = dataRow('Commutation', 'Not applicable — no commutation', y);
    }
  } else {
    y = secTitle('FAMILY PENSION NOTE', y);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setColor('#1f2937');
    let note;
    if (isTwoPhase) {
      note = `Two-phase verification: Phase 1 traces the veteran's pension from retirement (${retireStr}) to death (${deathStr}) — result Rs. ${result.veteranPensionAtDeath.toLocaleString('en-PK')}/month. Phase 2 applies ${(result.familyPensionPct*100).toFixed(0)}% family pension rate and all subsequent Finance Division increases from ${deathStr} to 2026. Commutation and restoration do not apply to family pension.`;
      if (result.pre1994Warning) note += ' WARNING: Veteran retired before 1994 — Finance Division OMs for years before 1994 are not on official record; pre-1994 years assumed 0% increase (conservative estimate).';
    } else {
      note = `Family pension = ${(result.familyPensionPct||0.5)*100}% of the veteran's gross pension at time of grant. Commutation and restoration do not apply to family pension. All Finance Division annual increases apply in full.`;
    }
    const lines = doc.splitTextToSize(note, innerW-6);
    doc.text(lines, margin+3, y); y += lines.length * 5 + 4;
  }

  // ══ PAGE 3 — YEAR-BY-YEAR TRAIL ═══════════════════════════
  doc.addPage(); pageHeader(3); y = 26;
  y = secTitle(isTwoPhase ? 'PENSION REVISION TRAIL — TWO-PHASE' : 'PENSION REVISION TRAIL', y);

  // Phase 1 header for two-phase
  if (isTwoPhase) {
    setFill('#1d4ed8'); doc.rect(margin, y-2, innerW, 7, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); setColor('#ffffff');
    doc.text(`PHASE 1: Veteran's Pension Trail (${retireStr} → ${deathStr})`, margin+3, y+3);
    y += 12; setColor('#000000');
  }

  // Table header
  setFill('#085c3a'); doc.rect(margin, y-4, innerW, 7, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); setColor('#ffffff');
  doc.text('Year', margin+3, y);
  doc.text('Event', margin+22, y);
  doc.text('Rate', margin+115, y);
  doc.text('Pension (Rs.)', W-margin-2, y, {align:'right'});
  y += 7;

  let rowIdx = 0;
  let phase2HeaderPrinted = false;

  for (const entry of result.trail) {
    if (y > 270) {
      doc.addPage(); pageHeader('3+'); y = 26;
      // Reprint table header on new page
      setFill('#085c3a'); doc.rect(margin, y-4, innerW, 7, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5); setColor('#ffffff');
      doc.text('Year', margin+3, y); doc.text('Event', margin+22, y);
      doc.text('Rate', margin+115, y); doc.text('Pension (Rs.)', W-margin-2, y, {align:'right'});
      y += 7; setColor('#000000');
    }

    // Print Phase 2 header banner before the transition row
    if (isTwoPhase && entry.phase === 2 && entry.isTransition && !phase2HeaderPrinted) {
      phase2HeaderPrinted = true;
      y += 4;
      setFill('#c9a227'); doc.rect(margin, y-2, innerW, 7, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); setColor('#ffffff');
      doc.text(`PHASE 2: Family Pension Trail — ${(result.familyPensionPct*100).toFixed(0)}% (${deathStr} → 2026)`, margin+3, y+3);
      y += 12; setColor('#000000');
    }

    if (rowIdx % 2 === 0) { setFill('#f3f4f6'); doc.rect(margin, y-4, innerW, 6, 'F'); }
    if (entry.isRestoration || entry.isTransition) { setFill('#e6f4ee'); doc.rect(margin, y-4, innerW, 6, 'F'); }
    if (entry.unconfirmed || entry.preRates) { setFill('#fdf6e3'); doc.rect(margin, y-4, innerW, 6, 'F'); }

    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setColor('#1f2937');
    const yearLabel = String(entry.year) + (entry.unconfirmed || entry.preRates ? ' ⚠' : '');
    doc.text(yearLabel, margin+3, y);
    doc.text((entry.event||'').substring(0,46), margin+22, y);
    const rateStr = entry.rate===null ? '—' : entry.rate===0 ? '0%' : `${(entry.rate*100).toFixed(1)}%`;
    doc.text(rateStr, margin+115, y);
    doc.setFont('helvetica','bold');
    doc.text(Math.round(entry.pension).toLocaleString('en-PK'), W-margin-2, y, {align:'right'});
    y += 6; rowIdx++;
  }

  // ══ PAGE 4 — COMMUTATION DETAIL (primary only) ════════════
  if (!isFamily && result.commutedAmount > 0) {
    doc.addPage(); pageHeader(4); y = 26;
    y = secTitle('COMMUTATION VERIFICATION', y);

    y = dataRow('Commuted Percentage', `${(meta.commutedPct*100).toFixed(0)}%`, y);
    y = dataRow('Commuted Monthly Amount', formatRs(result.commutedAmount), y);
    if (meta.ageAtRetirement) {
      const age = Math.min(Math.max(parseInt(meta.ageAtRetirement),35),65);
      const factor = COMMUTATION_FACTORS[age];
      y = dataRow('Age at Retirement', `${meta.ageAtRetirement} years`, y);
      if (factor) y = dataRow('Commutation Factor (age table)', factor.toFixed(2), y);
      if (result.lumpSumCalc) y = dataRow('Lump Sum Receivable', formatRs(result.lumpSumCalc), y, '#e6f4ee');
    }

    y = hLine(y+4);
    y = secTitle('RESTORATION ANALYSIS', y);

    if (result.restoInfo) {
      const ri = result.restoInfo;
      const effStr  = `${MONTHS_EN[ri.month-1]} ${ri.year}`;
      const calcStr = `${MONTHS_EN[ri.calcDate.month-1]} ${ri.calcDate.year}`;

      y = dataRow('Commutation Period (years)', ri.restorationYears || 'N/A', y);
      y = dataRow('Calculated Restoration Date', calcStr, y);

      // Phase explanation
      y += 2;
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); setColor('#1f2937');
      doc.text('Restoration Legal Phase:', margin+2, y); y += 6;
      doc.setFont('helvetica','normal');

      let phaseText = '';
      if (ri.rule === 'pre2001') {
        phaseText = 'Phase 1 (Retired on/before Nov 30, 2001): Normal restoration applies. Commuted portion is restored based on age index.';
        setColor('#0f7b4f');
      } else if (ri.rule.includes('reinstated_2015')) {
        phaseText = `Phase 2 (Retired Dec 2001–Jun 2015): Restoration was WITHDRAWN by Finance Division OM No.1(5)-Imp/2001 dated 4 Sep 2001. It was REINSTATED by Finance Division circular dated 07-07-2015. Effective restoration date: ${effStr}${ri.lateMonths > 0 ? ` (${ri.lateMonths} months after calculated date of ${calcStr})` : ''}.`;
        setColor('#c0392b');
      } else {
        phaseText = 'Phase 3 (Retired Jul 2015 onwards): Normal restoration applies per Finance Division circular 07-07-2015.';
        setColor('#0f7b4f');
      }
      const pLines = doc.splitTextToSize(phaseText, innerW-6);
      doc.text(pLines, margin+2, y); y += pLines.length * 5 + 6;
      setColor('#000000');

      y = dataRow('Effective Restoration Date', effStr, y, '#e6f4ee');
      if (meta.restored) {
        const actStr = `${MONTHS_EN[(meta.restoreMonth||1)-1]} ${meta.restoreYear}`;
        y = dataRow('User-Confirmed Restoration Date', actStr, y);
        if (result.restorationDelay && result.restorationDelay.delayMonths > 0)
          y = dataRow(`Delay (${result.restorationDelay.delayMonths} months) Arrears`, formatRs(result.restorationDelay.arrears), y, '#fdf0ef');
      } else {
        y += 2;
        setFill('#fdf0ef'); doc.rect(margin, y, innerW, 12, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8.5); setColor('#c0392b');
        doc.text(`Pension NOT restored. Effective restoration due: ${effStr}.`, margin+4, y+8);
        y += 16; setColor('#000000');
      }
    }
  }

  // ══ LAST PAGE — CMA FORMAL LETTER ═════════════════════════
  doc.addPage();
  const pgNum = (!isFamily && result.commutedAmount > 0) ? 5 : 4;
  pageHeader(pgNum); y = 26;
  y = secTitle('FORMAL STATEMENT FOR CMA SUBMISSION', y);

  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setColor('#1f2937');

  const letterLines = [
    'To:',
    'Controller Military Accounts (Pensions)',
    'Pension Branch, Lahore Cantt',
    '',
    `Subject: ${isFamily ? 'Family Pension' : 'Pension'} Verification — ${meta.serviceLabel}, ${meta.rankLabel}`,
    `         ${isTwoPhase ? `Veteran Retired: ${retireStr}  |  Family Pension From: ${deathStr}` : `Retired/Started: ${retireStr}`}`,
    '',
    'With due respect it is stated that:',
    '',
    isTwoPhase
      ? `1. The veteran retired from ${meta.serviceLabel} in the rank of ${meta.rankLabel} on ${retireStr}.`
      : `1. The undersigned retired from ${meta.serviceLabel} in the rank of ${meta.rankLabel}`,
    isTwoPhase
      ? `   The undersigned (widow/dependent) has been drawing family pension from ${deathStr}.`
      : `   with effect from ${retireStr}.`,
    '',
    isTwoPhase
      ? `2. Veteran's gross pension at retirement: ${formatRs(result.grossPension)}/month.`
      : `2. ${isFamily ? 'Family pension' : 'Gross pension'} at start date: ${formatRs(result.grossPension)}/month.`,
    ...(isTwoPhase ? [
      `   Veteran's calculated pension at death: ${formatRs(result.veteranPensionAtDeath)}/month.`,
      `   Family pension at grant (${(result.familyPensionPct*100).toFixed(0)}%): ${formatRs(result.familyPensionStart)}/month.`
    ] : []),
    '',
    `3. A verification has been conducted using official Finance Division`,
    `   Office Memoranda for the period ${meta.retireYear} to 2026.`,
    ...(isTwoPhase && result.pre1994Warning ? [
      '   NOTE: Finance Division OMs before 1994 are not on official record;',
      '   pre-1994 years are conservatively treated as 0% increase.'
    ] : []),
    '',
    result.status === 'underpaid'
      ? `4. Calculation indicates a monthly shortfall of ${formatRs(result.monthlyShortfall)}`
      : `4. Calculation indicates the pension appears correct.`,
    result.status === 'underpaid'
      ? `   Annual shortfall estimate: ${formatRs(result.annualShortfall)}.`
      : '',
    '',
    ...(result.restoInfo && result.restoInfo.rule === 'reinstated_2015' && result.restoInfo.lateMonths > 0 ? [
      `5. Restoration was delayed by ${result.restoInfo.lateMonths} months (Sep 2001 OM withdrawal,`,
      `   reinstated Jul 2015). Arrears for delay period are separately owed.`,
      ''
    ] : ['']),
    'Rate References:',
    '  • Finance Division OM 15-07-2019 (10%)',
    '  • Finance Division OM 10-07-2021 (10%)',
    '  • Finance Division OM 01-07-2022 (15%)',
    '  • Finance Division OM 05-07-2023 (17.5%)',
    '  • Finance Division OM 10-07-2024 (15%)',
    '  • Finance Division OM 07-07-2025 (7%)',
    '',
    'The pensioner respectfully requests review, correction, and payment of arrears.',
  ];

  letterLines.forEach(line => {
    if (y > 255) { doc.addPage(); pageHeader(''); y = 26; }
    doc.text(line, margin+4, y);
    y += line === '' ? 4 : 5.5;
  });

  y += 8;
  doc.setFont('helvetica','bold');
  doc.text('Signature: _______________________   Date: _______________', margin+4, y);

  y += 12;
  setFill('#f3f4f6'); doc.rect(margin, y, innerW, 20, 'F');
  doc.setFont('helvetica','italic'); doc.setFontSize(7); setColor('#6b7280');
  const disc = 'DISCLAIMER: Estimates based on publicly available Finance Division notifications. For guidance only — verify with CMA (Pensions) Lahore before legal proceedings. Developers accept no liability for errors or omissions.';
  doc.text(doc.splitTextToSize(disc, innerW-6), margin+3, y+5);

  y += 26;
  doc.setFont('helvetica','normal'); doc.setFontSize(8); setColor('#0f7b4f');
  doc.text('Generated by FaujiPension.com', margin+4, y);
  doc.text(today, W-margin-4, y, {align:'right'});

  doc.save(`FaujiPension_Report_${refNo}.pdf`);
}

// ── Called from app.js result screen ──────────────────────
window.generateFullPDFReport = function() {
  if (!calcResult) return;
  generateFullPDF(calcResult, calcResult.meta);
};
