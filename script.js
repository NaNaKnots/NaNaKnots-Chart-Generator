"use strict";
// Symbols are this application's chart conventions; the legend always travels with the chart.
const STITCHES = {
  k: { symbol: "", label: "Knit" },
  p: { symbol: "•", label: "Purl" },
  sl: { symbol: "V", label: "Slip, yarn in back" },
  yo: { symbol: "○", label: "Yarn over" },
  k2tog: { symbol: "/", label: "Knit 2 together" },
  skpo: { symbol: "\\", label: "Slip, knit, pass slipped stitch over" }
};
const $ = id => document.getElementById(id);
let selected = "p";
let motif = [];
const numeric = (id, min, max) => Math.min(max, Math.max(min, Number.parseInt($(id).value, 10) || min));
function settings() {
  return {
    stitches: numeric("stitches", 1, 240),
    rounds: numeric("rounds", 1, 120),
    width: numeric("motifWidth", 1, 24),
    height: numeric("motifHeight", 1, 24),
    placement: $("placement").value,
    bandStart: numeric("bandStart", 1, 120),
    bandEnd: numeric("bandEnd", 1, 120)
  };
}
function resizeMotif(width, height) {
  motif = Array.from({length: height}, (_, r) =>
    Array.from({length: width}, (_, c) => motif[r]?.[c] || "k"));
}
function palette() {
  $("palette").replaceChildren();
  for (const [key, item] of Object.entries(STITCHES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(selected === key));
    const symbol = document.createElement("span");
    symbol.className = "symbol";
    symbol.textContent = item.symbol || "□";
    button.append(symbol, document.createTextNode(item.label));
    button.onclick = () => { selected = key; palette(); };
    $("palette").append(button);
  }
}
function drawChart(target, rows, editable = false) {
  const table = document.createElement("table");
  table.className = "chart";
  table.setAttribute("aria-label", editable ? "Editable motif" : "Beanie body chart");
  const tbody = document.createElement("tbody");
  // Round 1 at bottom; chart columns are displayed in conventional right-to-left reading order.
  for (let r = rows.length - 1; r >= 0; r--) {
    const tr = document.createElement("tr");
    const heading = document.createElement("th");
    heading.textContent = r + 1;
    heading.scope = "row";
    tr.append(heading);
    for (let c = rows[r].length - 1; c >= 0; c--) {
      const key = rows[r][c];
      const td = document.createElement("td");
      td.className = `${key === "k" ? "knit" : ""} ${editable ? "editable" : ""}`;
      td.textContent = STITCHES[key]?.symbol ?? "?";
      td.title = `Round ${r + 1}, stitch ${c + 1}: ${STITCHES[key]?.label || "Unknown"}`;
      if (editable) {
        td.tabIndex = 0;
        td.setAttribute("role", "button");
        td.setAttribute("aria-label", td.title);
        const paint = () => { motif[r][c] = selected; render(); };
        td.onclick = paint;
        td.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); paint(); } };
      }
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  target.replaceChildren(table);
}
function render() {
  const s = settings();
  resizeMotif(s.width, s.height);
  drawChart($("motifChart"), motif, true);
  const body = Array.from({length:s.rounds}, (_, r) =>
    Array.from({length:s.stitches}, (_, c) => {
      const inBand = s.placement === "all" || (r + 1 >= s.bandStart && r + 1 <= s.bandEnd);
      return inBand ? motif[r % s.height][c % s.width] : "k";
    }));
  drawChart($("bodyChart"), body);
  const exact = s.stitches % s.width === 0;
  const hasShaping = motif.some(row => row.some(key => ["yo","k2tog","skpo"].includes(key)));
  $("status").textContent = `${s.stitches} stitches × ${s.rounds} body rounds · ${Math.floor(s.stitches/s.width)} full motif repeats${exact ? "" : ` + ${s.stitches % s.width} extra stitches`}.${hasShaping ? " Caution: increases/decreases are visual only and not yet stitch-count validated." : ""}`;
}
function legend() {
  for (const item of Object.values(STITCHES)) {
    const span = document.createElement("span");
    span.textContent = `${item.symbol || "□"} = ${item.label}`;
    $("legend").append(span);
  }
}
function downloadJson() {
  const data = {version:1, settings:settings(), motif, legend:STITCHES};
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:"application/json"}));
  const a = document.createElement("a");
  a.href = url;
  a.download = "nanaknots-pattern.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
for (const id of ["stitches","rounds","motifWidth","motifHeight","placement","bandStart","bandEnd"]) {
  $(id).addEventListener("change", render);
}
$("save").onclick = () => { try {localStorage.setItem("nanaknots-v1", JSON.stringify({settings:settings(), motif})); alert("Saved in this browser.");} catch {alert("Browser storage is unavailable. Use Export JSON instead.");} };
$("load").onclick = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("nanaknots-v1"));
    if (!saved || !saved.settings || !Array.isArray(saved.motif)) throw new Error("No saved design found.");
    for (const [key,id] of Object.entries({stitches:"stitches",rounds:"rounds",width:"motifWidth",height:"motifHeight",placement:"placement",bandStart:"bandStart",bandEnd:"bandEnd"})) {
      if (saved.settings[key] !== undefined) $(id).value = saved.settings[key];
    }
    motif = saved.motif.map(row => Array.isArray(row) ? row.map(k => STITCHES[k] ? k : "k") : []);
    render();
  } catch (e) { alert(e.message); }
};
$("export").onclick = downloadJson;
$("reset").onclick = () => { motif = []; render(); };
legend(); palette(); render();

function generateCrown(startingStitches = 96) {
  const sections = 4;
  const decreasePerSection = 2;
  const finishingStitches = 8;

  if (startingStitches !== 96) {
    throw new Error(
    "This crown pattern currently supports 96 stitches."
    );
  }
  
  let stitches = startingStitches;
  const crownRounds = [];

for (let round = 1; round <= 21; round++) {
  let decreases = 0;
  let instruction = "";

  if (round === 21) {
    decreases = stitches / 2;
    instruction = "K2tog around";
  } else if (round % 2 === 1) {
    decreases = sections * decreasePerSection;
    instruction =
      "Work slipped-stitch crown patern with K2tog and SKPO";
  } else {
    instruction = "Knit all stitches";
  }

  stitches -= decreases;

  crownRounds.push({
    round: round,
    instruction: instruction,
    decreases: decreases,
    stitchesRemaining: stitches,
    stitchesPerNeedle: stitches / sections
    });
  }
  
  if (stitches !== finishingStitches) {
    throw new Error("Crown stitch count is incorrect.");
  }

  return crownRounds;
}

console.table(generateCrown()); // temporary code
