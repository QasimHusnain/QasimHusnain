/**
 * PDF Report Generator — FaujiPension
 * Uses jsPDF (loaded from CDN in index.html)
 * Generates a full 6-page verification report.
 */

function generateFullPDF(result, meta) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const margin = 20;
  const innerW = W - margin * 2;

  const refNo = 'FP-' + Date.now().toString(36).toUpperCase();
  const today = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Helpers ──────────────────────────────────────────────
  function color(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    doc.setTextColor(r, g, b);
  }
  function fillColor(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    doc.setFillColor(r, g, b);
  }
  function drawColor(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    doc.setDrawColor(r, g, b);
  }

  function pageHeader(title, pageNum) {
    fillColor('#0f7b4f');
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    color('#ffffff');
    doc.text('PAKISTAN MILITARY PENSION VERIFICATION REPORT', margin, 11);
    doc.text(`Page ${pageNum}`, W - margin, 11, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${refNo}`, margin, 16);
    doc.text(today, W - margin, 16, { align: 'right' });
    color('#000000');
  }

  function sectionTitle(text, y) {
    fillColor('#0f7b4f');
    doc.rect(margin, y, innerW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    color('#ffffff');
    doc.text(text, margin + 3, y + 5);
    color('#000000');
    return y + 12;
  }

  function row(label, value, y, highlight) {
    if (highlight) {
      fillColor('#e6f4ee');
      doc.rect(margin, y - 4, innerW, 7, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    color('#6b7280');
    doc.text(label, margin + 2, y);
    doc.setFont('helvetica', 'bold');
    color(highlight ? '#0f7b4f' : '#1f2937');
    doc.text(value, W - margin - 2, y, { align: 'right' });
    color('#000000');
    return y + 7;
  }

  function rowRed(label, value, y) {
    fillColor('#fdf0ef');
    doc.rect(margin, y - 4, innerW, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    color('#6b7280');
    doc.text(label, margin + 2, y);
    doc.setFont('helvetica', 'bold');
    color('#c0392b');
    doc.text(value, W - margin - 2, y, { align: 'right' });
    color('#000000');
    return y + 7;
  }

  function hline(y) {
    drawColor('#e5e7eb');
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    return y + 4;
  }

  // ── PAGE 1 — COVER ───────────────────────────────────────
  pageHeader('Cover', 1);

  // Star emblem placeholder
  doc.setFontSize(32);
  doc.text('⭐', W / 2, 50, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  color('#0f7b4f');
  doc.text('PAKISTAN MILITARY PENSION', W / 2, 65, { align: 'center' });
  doc.text('VERIFICATION REPORT', W / 2, 74, { align: 'center' });

  drawColor('#c9a227');
  doc.setLineWidth(1);
  doc.line(margin + 20, 79, W - margin - 20, 79);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  color('#1f2937');

  const serviceName = meta.serviceLabel || meta.service;
  const rankName    = meta.rankLabel || meta.rank;
  const retireStr   = `${MONTHS_EN[meta.retireMonth - 1]} ${meta.retireYear}`;

  let y = 90;
  const fields = [
    ['Service:', serviceName],
    ['Category:', meta.categoryLabel || meta.category],
    ['Rank:', rankName],
    ['Retirement Date:', retireStr],
    ['Reference No:', refNo],
    ['Generated:', today]
  ];
  fields.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    color('#6b7280');
    doc.text(label, margin + 10, y);
    doc.setFont('helvetica', 'normal');
    color('#1f2937');
    doc.text(val, margin + 55, y);
    y += 9;
  });

  // Verdict badge
  const verdictBg  = result.status === 'underpaid' ? '#fdf0ef'
                   : result.status === 'correct'   ? '#e6f4ee' : '#fdf6e3';
  const verdictClr = result.status === 'underpaid' ? '#c0392b'
                   : result.status === 'correct'   ? '#0f7b4f' : '#c9a227';
  const verdictTxt = result.status === 'underpaid' ? 'POSSIBLY UNDERPAID'
                   : result.status === 'correct'   ? 'PENSION APPEARS CORRECT' : 'VERIFY — POSSIBLE OVERPAYMENT';

  y += 8;
  doc.setFillColor(...hexToRgb(verdictBg));
  doc.roundedRect(margin + 20, y, innerW - 40, 18, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  color(verdictClr);
  doc.text(verdictTxt, W / 2, y + 12, { align: 'center' });

  y += 28;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  color('#6b7280');
  doc.text('This report uses official Finance Division Office Memoranda rates.', W / 2, y, { align: 'center' });
  doc.text('Verify with CMA (Pensions) Lahore before legal proceedings.', W / 2, y + 5, { align: 'center' });

  // ── PAGE 2 — SUMMARY ─────────────────────────────────────
  doc.addPage();
  pageHeader('Summary', 2);
  y = 26;
  y = sectionTitle('VERIFICATION SUMMARY', y);

  y = row('Gross Pension at Retirement', formatRs(result.grossPension), y);
  y = row('Retained Pension (after commutation)', formatRs(result.retainedPension), y);
  y = row('Pension Currently Being Drawn', formatRs(result.currentPension), y);
  y = row('Calculated Correct Pension (2026)', formatRs(result.correctPension), y, true);

  if (result.status === 'underpaid') {
    y = rowRed('Monthly Shortfall', formatRs(result.monthlyShortfall), y);
    y = rowRed('Estimated Annual Shortfall', formatRs(result.annualShortfall), y);
  } else {
    y = row('Difference (Correct vs Drawn)', formatRs(Math.abs(result.difference)), y);
  }

  y = hline(y + 2);
  y = sectionTitle('COMMUTATION STATUS', y);

  if (meta.commuted) {
    y = row('Commuted Percentage', `${(meta.commutedPct * 100).toFixed(0)}%`, y);
    y = row('Commuted Monthly Amount', formatRs(result.commutedAmount), y);
    if (result.lumpSumCalc) {
      y = row('Lump Sum Receivable (calculated)', formatRs(result.lumpSumCalc), y);
    }
    y = row('Commutation Status', 'Verified ✓', y, true);
  } else {
    y = row('Commutation', 'Not applicable — no commutation', y);
  }

  y = hline(y + 2);
  y = sectionTitle('RESTORATION STATUS', y);

  if (meta.commuted && result.estRestoreYear) {
    const estStr = `${MONTHS_EN[result.estRestoreMonth - 1]} ${result.estRestoreYear}`;
    y = row('Estimated Restoration Date', estStr, y);
    if (meta.restored) {
      const actStr = `${MONTHS_EN[result.effectiveRestoreMonth - 1]} ${result.effectiveRestoreYear}`;
      y = row('Actual Restoration Date', actStr, y);
      if (result.restorationDelay && result.restorationDelay.delayMonths > 0) {
        y = rowRed(`Delay (${result.restorationDelay.delayMonths} months)`,
          `Arrears ~${formatRs(result.restorationDelay.arrears)}`, y);
      } else {
        y = row('Restoration Timing', 'On time ✓', y, true);
      }
    } else {
      y = rowRed('Restoration Status', 'NOT YET RESTORED — check arrears', y);
    }
  } else if (!meta.commuted) {
    y = row('Restoration', 'Not applicable — no commutation', y);
  }

  // ── PAGE 3 — YEAR BY YEAR TRAIL ──────────────────────────
  doc.addPage();
  pageHeader('Year-by-Year Trail', 3);
  y = 26;
  y = sectionTitle('PENSION REVISION TRAIL', y);

  // Table header
  fillColor('#085c3a');
  doc.rect(margin, y - 4, innerW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  color('#ffffff');
  doc.text('Year', margin + 3, y);
  doc.text('Event', margin + 22, y);
  doc.text('Rate', margin + 110, y);
  doc.text('Pension (Rs.)', W - margin - 2, y, { align: 'right' });
  y += 7;

  let rowIdx = 0;
  for (const entry of result.trail) {
    if (y > H - 30) {
      doc.addPage();
      pageHeader('Year-by-Year Trail (cont.)', '3+');
      y = 26;
    }
    if (rowIdx % 2 === 0) {
      fillColor('#f3f4f6');
      doc.rect(margin, y - 4, innerW, 6, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    color('#1f2937');
    doc.text(String(entry.year), margin + 3, y);
    doc.text(entry.event.substring(0, 45), margin + 22, y);
    const rateStr = entry.rate === null ? '—' : entry.rate === 0 ? '0%' : `${(entry.rate * 100).toFixed(1)}%`;
    doc.text(rateStr, margin + 110, y);
    doc.setFont('helvetica', 'bold');
    doc.text(formatRsNum(entry.pension), W - margin - 2, y, { align: 'right' });
    y += 6;
    rowIdx++;
  }

  // ── PAGE 4 — COMMUTATION VERIFICATION ────────────────────
  if (meta.commuted) {
    doc.addPage();
    pageHeader('Commutation Verification', 4);
    y = 26;
    y = sectionTitle('COMMUTATION VERIFICATION', y);

    y = row('Commuted Percentage', `${(meta.commutedPct * 100).toFixed(0)}%`, y);
    y = row('Commuted Monthly Amount', formatRs(result.commutedAmount), y);
    if (meta.ageAtRetirement) {
      const factor = COMMUTATION_FACTORS[Math.min(Math.max(parseInt(meta.ageAtRetirement), 35), 65)];
      y = row('Age at Retirement', `${meta.ageAtRetirement} years`, y);
      y = row('Commutation Factor', factor ? factor.toFixed(2) : 'N/A', y);
      if (result.lumpSumCalc) {
        y = row('Lump Sum (calculated)', formatRs(result.lumpSumCalc), y, true);
      }
    }

    y = hline(y + 4);
    y = sectionTitle('RESTORATION CALCULATION', y);
    if (result.estRestoreYear) {
      const estStr = `${MONTHS_EN[result.estRestoreMonth - 1]} ${result.estRestoreYear}`;
      y = row('Commutation Period (years)', result.restorationYears || 'N/A', y);
      y = row('Estimated Restoration Due', estStr, y, true);
      if (meta.restored) {
        const actStr = `${MONTHS_EN[result.effectiveRestoreMonth - 1]} ${result.effectiveRestoreYear}`;
        y = row('Actual Restoration Date', actStr, y);
        if (result.restorationDelay && result.restorationDelay.delayMonths > 0) {
          y += 4;
          fillColor('#fdf0ef');
          doc.rect(margin, y - 4, innerW, 18, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          color('#c0392b');
          doc.text(`Restoration Delay: ${result.restorationDelay.delayMonths} months`, margin + 4, y + 2);
          doc.text(`Arrears Estimate: ${formatRs(result.restorationDelay.arrears)}`, margin + 4, y + 9);
          y += 24;
        }
      } else {
        y += 4;
        fillColor('#fdf0ef');
        doc.rect(margin, y, innerW, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        color('#c0392b');
        doc.text('Pension has NOT been restored. Significant arrears may be owed.', margin + 4, y + 8);
        y += 18;
      }
    }
  }

  // ── PAGE 5 — FORMAL CMA LETTER ───────────────────────────
  doc.addPage();
  pageHeader('CMA Submission Letter', meta.commuted ? 5 : 4);
  y = 26;
  y = sectionTitle('FORMAL STATEMENT FOR CMA SUBMISSION', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  color('#1f2937');

  const letterLines = [
    'To:',
    'Controller Military Accounts (Pensions)',
    'Pension Branch, Lahore Cantt',
    '',
    `Subject: Verification of Pension — ${serviceName}, ${rankName}, Retired ${MONTHS_EN[meta.retireMonth - 1]} ${meta.retireYear}`,
    '',
    'With due respect, it is stated that:',
    '',
    `1. The undersigned/pensioner retired from ${serviceName} in the rank of ${rankName}`,
    `   with effect from ${MONTHS_EN[meta.retireMonth - 1]} ${meta.retireYear}.`,
    '',
    `2. The gross pension at retirement was Rs. ${formatRsNum(result.grossPension)} per month.`,
    '',
    `3. A pension verification has been conducted using official Finance Division`,
    `   Office Memoranda for the period ${meta.retireYear} to 2026.`,
    '',
    result.status === 'underpaid'
      ? `4. The calculation indicates a monthly shortfall of ${formatRs(result.monthlyShortfall)}`
      : `4. The calculation indicates the pension appears to be correct.`,
    result.status === 'underpaid'
      ? `   with effect from [date to be confirmed]. Annual shortfall: ${formatRs(result.annualShortfall)}.`
      : '',
    '',
    '5. The pensioner respectfully requests review and correction of pension',
    '   and payment of arrears if applicable.',
    '',
    'Official Rate References Used:',
    '  • Finance Division OM dated 15-07-2019 (10%)',
    '  • Finance Division OM dated 10-07-2021 (10%)',
    '  • Finance Division OM dated 01-07-2022 (15%)',
    '  • Finance Division OM dated 05-07-2023 (17.5%)',
    '  • Finance Division OM dated 10-07-2024 (15%)',
    '  • Finance Division OM dated 07-07-2025 (7%)',
  ];

  letterLines.forEach(line => {
    if (y > H - 40) { doc.addPage(); pageHeader('CMA Letter (cont.)', ''); y = 26; }
    doc.text(line, margin + 4, y);
    y += line === '' ? 4 : 6;
  });

  // Signature block
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Pensioner Signature: _______________________', margin + 4, y);
  y += 10;
  doc.text('Date: _______________________', margin + 4, y);
  y += 14;

  // ── DISCLAIMER ───────────────────────────────────────────
  fillColor('#f3f4f6');
  doc.rect(margin, y, innerW, 22, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  color('#6b7280');
  const disclaimer = 'DISCLAIMER: This report provides estimates based on publicly available Finance Division notifications. Results are for guidance only and should be verified with CMA (Pensions) Lahore before any legal proceedings. The developers accept no liability for errors or omissions.';
  const splitDisc = doc.splitTextToSize(disclaimer, innerW - 8);
  doc.text(splitDisc, margin + 4, y + 6);

  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  color('#0f7b4f');
  doc.text('Generated by FaujiPension.com', margin + 4, y);
  doc.text(today, W - margin - 4, y, { align: 'right' });

  // ── Save ─────────────────────────────────────────────────
  doc.save(`FaujiPension_Report_${refNo}.pdf`);
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1,3),16),
    parseInt(hex.slice(3,5),16),
    parseInt(hex.slice(5,7),16)
  ];
}

function formatRsNum(n) {
  return Math.round(n).toLocaleString('en-PK');
}

// Override the generatePDF in app.js for direct download (Phase 1 still shows payment)
// This function is available for Phase 2 auto-generate after payment confirmation.
window.generateFullPDFReport = function() {
  if (!calcResult) return;
  const meta = calcResult.meta;
  const serviceEl  = document.getElementById('service');
  const categoryEl = document.getElementById('category');
  const rankEl     = document.getElementById('rank');
  meta.serviceLabel  = serviceEl.options[serviceEl.selectedIndex]?.text;
  meta.categoryLabel = categoryEl.options[categoryEl.selectedIndex]?.text;
  meta.rankLabel     = rankEl.options[rankEl.selectedIndex]?.text;
  generateFullPDF(calcResult, meta);
};
