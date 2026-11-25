// @author piercer
const STORAGE_KEY = "piercer_drop_calc_v1";
const $ = (id) => document.getElementById(id);

function brl(n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      salePrice: $("salePrice").value,
      supplierCost: $("supplierCost").value,
      supCurrency: $("supCurrency").value,
      usdRate: $("usdRate").value,
      gwPct: $("gwPct").value,
      checkoutPct: $("checkoutPct").value,
      taxPct: $("taxPct").value,
      cpaCost: $("cpaCost").value,
      chargebackPct: $("chargebackPct").value,
    }));
  } catch {}
}

try {
  const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (s) {
    ["salePrice", "supplierCost", "supCurrency", "usdRate", "gwPct", "checkoutPct", "taxPct", "cpaCost", "chargebackPct"].forEach((id) => {
      if (s[id] !== undefined) $(id).value = s[id];
    });
  }
} catch {}

function calculate() {
  const gross = Math.max(1, Number($("salePrice").value) || 1);
  const rawSup = Math.max(0, Number($("supplierCost").value) || 0);
  const supCost = $("supCurrency").value === "USD"
    ? rawSup * Math.max(1, Number($("usdRate").value) || 5.75) * 1.0438
    : rawSup;
  const pctTotal = (Number($("gwPct").value) + Number($("checkoutPct").value) + Number($("taxPct").value) + Number($("chargebackPct").value)) / 100;
  const fees = gross * Math.max(0, pctTotal);
  const cpa = Math.max(0, Number($("cpaCost").value) || 0);

  const maxCpa = Math.max(0, gross - supCost - fees);
  const profit = maxCpa - cpa;
  const margin = Math.round((profit / gross) * 100);
  const breakRoas = maxCpa > 0 ? (gross / maxCpa).toFixed(2) : "∞";
  const currentRoas = cpa > 0 ? (gross / cpa).toFixed(2) : "∞";

  $("outProfit").textContent = brl(profit);
  $("outProfit").style.color = profit >= 0 ? "var(--green)" : "var(--red)";
  $("outMargin").textContent = `Margem líquida: ${margin}%`;
  $("outMaxCpa").textContent = brl(maxCpa);
  $("outBreakRoas").textContent = `ROAS Empate: ${breakRoas}x`;
  $("outCurrentRoas").textContent = `${currentRoas}x`;
  $("outFees").textContent = `Taxas + Reserva: ${brl(fees)}`;
  $("outBatch100").textContent = brl(profit * 100);
  $("outRev100").textContent = `Faturamento: ${brl(gross * 100)}`;

  const pPct = Math.max(0, Math.min(100, (profit / gross) * 100));
  const r = 44, c = 2 * Math.PI * r;
  $("donutSvg").innerHTML = `
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--red)" stroke-width="14" />
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--green)" stroke-width="14"
      stroke-dasharray="${(pPct / 100) * c} ${c}" transform="rotate(-90 60 60)" />
    <text x="60" y="64" text-anchor="middle" fill="var(--text)" font-size="16" font-weight="700" font-family="JetBrains Mono">${Math.round(pPct)}%</text>
  `;
  $("donutLegend").innerHTML = `● Lucro: <strong style="color:var(--green)">${brl(profit)}</strong><br>● Fornecedor + CPA: <strong>${brl(supCost + cpa)}</strong><br>● Taxas/Imp: <strong style="color:var(--red)">${brl(fees)}</strong>`;

  $("scaleOut").innerHTML = [10, 30, 100].map((d) => {
    const mProfit = profit * d * 30;
    const giro = (supCost + cpa) * d * 7; // 7 dias de giro
    return `• ${d} pedidos/dia → Lucro/mês: <strong style="color:var(--green)">${brl(mProfit)}</strong> | Giro (7d): <strong>${brl(giro)}</strong>`;
  }).join("<br>");

  saveState();
}

["salePrice", "supplierCost", "supCurrency", "usdRate", "gwPct", "checkoutPct", "taxPct", "cpaCost", "chargebackPct"].forEach((id) => {
  $(id).addEventListener("input", calculate);
  $(id).addEventListener("change", calculate);
});
$("printBtn").addEventListener("click", () => window.print());
$("resetBtn").addEventListener("click", () => { localStorage.removeItem(STORAGE_KEY); location.reload(); });
$("copyBtn").addEventListener("click", async () => {
  const txt = `Drop (${brl(Number($("salePrice").value))}) → Lucro: ${$("outProfit").textContent} | CPA Máx: ${$("outMaxCpa").textContent} (${$("outBreakRoas").textContent})`;
  try { await navigator.clipboard.writeText(txt); const t = $("toast"); t.textContent = "Resumo copiado!"; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2200); } catch {}
});

calculate();

(() => {
  fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    .then((r) => r.json())
    .then((d) => {
      const bid = Number(d?.USDBRL?.bid);
      const el = document.getElementById('usdToBrl') || document.getElementById('usdBrl');
      if (bid > 0 && el) { el.value = bid.toFixed(2); el.dispatchEvent(new Event('input', { bubbles: true })); }
    }).catch(() => {});
})();
