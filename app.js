let DATAFILE = "data/season3.json";
let currentSeason = 3;
let allData = [];
let selectedDate = "all";
let selectedTop = 8;
const el = (id) => document.getElementById(id);
const req = (id) => {
  const e = el(id);
  if (!e) throw new Error("Missing #" + id);
  return e;
};
function normalizeDate(v) {
  return (v || "").slice(0, 10);
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00")
    .toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}
function getUniqueDates(data) {
  return [
    ...new Set(data.map((r) => normalizeDate(r.Fecha)).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
}
function getFiltered() {
  return selectedDate === "all"
    ? allData
    : allData.filter((r) => normalizeDate(r.Fecha) === selectedDate);
}

function getRelMultiplier(rel) {
  const relNorm = (rel || "").toLowerCase();

  if (currentSeason === 4) {
    // Season 4: Competitivo 2x, RCQ 1.5x, resto 1x
    if (relNorm.includes("competitivo")) return 2;
    if (relNorm.includes("rcq")) return 1.5;
    return 1;
  }

  // Season 3: Competitivo 2x, resto 1x
  if (relNorm.includes("competitivo")) return 2;
  return 1;
}

function groupByTournament(data) {
  const g = {};
  data.forEach((r) => {
    const k = normalizeDate(r.Fecha);
    if (!g[k]) g[k] = [];
    g[k].push(r);
  });
  return Object.entries(g)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, entries], i) => ({
      key: date,
      label: `Torneo ${i + 1}`,
      entries: entries.sort((a, b) => Number(a.Puesto) - Number(b.Puesto)),
    }));
}
async function init() {
  try {
    const res = await fetch(DATAFILE);
    if (!res.ok) throw new Error("fetch failed");
    allData = await res.json();
    if (!Array.isArray(allData) || !allData.length)
      throw new Error("empty data");

    setupDropdowns();
    setupTournamentToggle();
    render();

    // SOLO dashboard, sin tocar loading aquí
    req("dashboard").classList.add("visible");
  } catch (err) {
    console.error(err);
    const errorScreen = el("errorScreen");
    if (errorScreen) errorScreen.classList.add("visible");
  }
}
function setSeason(season) {
  currentSeason = Number(season);

  if (season === "3") {
    DATAFILE = "data/season3.json";
  } else if (season === "4") {
    DATAFILE = "data/season4.json";
  }
}
function setupDropdowns() {
  const dates = getUniqueDates(allData);
  const menu = req("dropdownMenu");
  const label = req("dropdownLabel");
  const btn = req("dropdownBtn");
  const wrap = req("dropdownWrap");
  const options = [
    { value: "all", label: "Todos los torneos" },
    ...dates.map((d) => ({ value: d, label: formatDate(d) })),
  ];
  menu.innerHTML = options
    .map(
      (o, i) =>
        `<li data-value="${o.value}" class="${i === 0 ? "active" : ""}">${o.label}</li>`,
    )
    .join("");
  btn.addEventListener("click", () => menu.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) menu.classList.remove("open");
  });
  menu.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    menu.querySelectorAll("li").forEach((l) => l.classList.remove("active"));
    li.classList.add("active");
    label.textContent = li.textContent;
    menu.classList.remove("open");
    selectedDate = li.dataset.value;
    render();
  });
  const tf = el("topFilter");
  if (tf)
    tf.addEventListener("change", (e) => {
      selectedTop = Number(e.target.value);
      render();
    });
}
function setupTournamentToggle() {
  const grid = req("weekGrid");
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-ver-mas");
    if (!btn) return;
    const target = el(btn.dataset.uid);
    if (!target) return;
    const isCollapsed = target.classList.contains("is-collapsed");
    target.classList.toggle("is-collapsed");
    btn.textContent = isCollapsed
      ? "Ocultar"
      : `Ver más (${btn.dataset.count})`;
  });
}
function render() {
  const raw = getFiltered();
  if (!raw.length) return;
  const tournaments = groupByTournament(raw);
  const byPlayer = {};
  raw.forEach((r) => {
    const n = r.Nombre;
    if (!byPlayer[n])
      byPlayer[n] = {
        name: n,
        entries: [],
        pts: 0,
        ptsRaw: 0,
        w: 0,
        d: 0,
        l: 0,
        decks: [],
      };
    const p = byPlayer[n];
   const multiplier = getRelMultiplier(r.REL);
  p.entries.push(r);
  p.pts += Number(r.Puntos || 0) * multiplier;
  p.ptsRaw += Number(r.Puntos || 0);
  p.w += parseInt(r.V || 0, 10);
  p.d += parseInt(r.E || 0, 10);
  p.l += parseInt(r.D || 0, 10);
  p.decks.push(r.Arquetipo);
});
  const players = Object.values(byPlayer).sort((a, b) => b.pts - a.pts);
  req("metaTotalPlayers").textContent = players.length;
  req("metaTotalTournaments").textContent = tournaments.length;
  const topNRows = tournaments.flatMap((g) =>
    g.entries.filter((r) => Number(r.Puesto) <= selectedTop),
  );
  const byArch = {};
  topNRows.forEach((r) => {
    const a = r.Arquetipo;
    if (!byArch[a]) byArch[a] = { name: a, count: 0, wins: 0, games: 0 };
    byArch[a].count++;
    byArch[a].wins += parseInt(r.V || 0, 10);
    byArch[a].games +=
      parseInt(r.V || 0, 10) + parseInt(r.D || 0, 10) + parseInt(r.E || 0, 10);
  });
  const archs = Object.values(byArch).sort((a, b) => b.count - a.count);
  let mostConsistent = null,
    bestAvg = 99;
  players
    .filter((p) => p.entries.length >= 2)
    .forEach((p) => {
      const avg =
        p.entries.reduce((s, e) => s + Number(e.Puesto), 0) / p.entries.length;
      if (avg < bestAvg) {
        bestAvg = avg;
        mostConsistent = p;
      }
    });
  renderFinalRank(players);
  renderPlayerTable(players);
  renderArchetypes(archs);
  renderPieChart(archs);
  renderTournaments(tournaments);
  renderFacts(archs, mostConsistent, bestAvg, tournaments);
}
function computeFinalPoints(p) {
  const att = p.entries.length;

  if (currentSeason === 4) {
    // Season 4: Pts torneo ponderados + asistencia (sin bonus)
    const bonus = 0;
    const finalPts = p.pts + att;
    return { att, bonus, finalPts };
  }

  // Season 3: Pts torneo ponderados + asistencia + 1 pto cada 3 asistencias
  const bonus = Math.floor(att / 3);
  const finalPts = p.pts + att + bonus;
  return { att, bonus, finalPts };
}
function renderFinalRank(players) {
  const final = players
    .map((p) => {
    const { att, bonus, finalPts } = computeFinalPoints(p);
      return { ...p, att, bonus, finalPts };
    })
    .sort((a, b) => b.finalPts - a.finalPts);
  req("finalRankBody").innerHTML = final
    .map((p, i) => {
      const name = p.name.replace(/\s+/g, " ").trim();
      const isTop = i < 3;
      const rankClass = i === 0 ? "top1" : isTop ? "top3" : "";
      return `<tr ${i === 0 ? 'class="row-leader"' : ""}><td><div class="player-name"><span class="rank-num ${rankClass}">${i + 1}</span>${name}</div></td><td><span class="pts-big">${p.ptsRaw}</span></td><td><span class="badge ${p.att >= 2 ? "badge-yellow" : "badge-dim"}">${p.att} torneo${p.att !== 1 ? "s" : ""}</span></td><td><span class="badge ${p.bonus > 0 ? "badge-green" : "badge-dim"}">${p.bonus}</span><div class="breakdown">${p.att} / 4</div></td><td><span class="pts-big ${i === 0 ? "leader" : ""}">${p.finalPts}</span><div class="breakdown">${p.pts} + ${p.att} + ${p.bonus}</div></td></tr>`;
    })
    .join("");
}
function renderPlayerTable(players) {
  req("playerTableBody").innerHTML = players
    .map((p, i) => {
      const name = p.name.replace(/\s+/g, " ").trim();
      const deckStr = [...new Set(p.decks)].join(", ");
      const rankClass = i === 0 ? "top1" : i < 3 ? "top3" : "";
      const dotsW = Array(Math.min(p.w, 20))
        .fill('<span class="dot w"></span>')
        .join("");
      const dotsD = Array(Math.min(p.d, 20))
        .fill('<span class="dot d"></span>')
        .join("");
      const dotsL = Array(Math.min(p.l, 20))
        .fill('<span class="dot l"></span>')
        .join("");
      return `<tr ${i === 0 ? 'class="row-leader"' : ""}><td><div class="player-cell"><div class="player-name"><span class="rank-num ${rankClass}">${i + 1}</span>${name}</div><div class="player-decks">${deckStr}</div></div></td><td><div class="wdl-wrap">${dotsW}${dotsD}${dotsL}<span class="wdl-text">${p.w}W · ${p.d}E · ${p.l}L</span></div></td></tr>`;
    })
    .join("");
}
const ARCHCOLORS = [
  "#f5c800",
  "#7b61ff",
  "#ff4757",
  "#3ddc84",
  "#ff9f43",
  "#38b2ff",
  "#ff6b9d",
  "#a78bfa",
  "#e8ff47",
  "#00d2d3",
];
function wrColor(pct) {
  if (pct >= 65) return "#44cc77";
  if (pct >= 55) return "#88cc44";
  if (pct >= 50) return "#f5c800";
  if (pct >= 42) return "#f59500";
  return "#e03030";
}
function renderArchetypes(archs) {
  const wrap = req("archetypeGrid");
  const header = wrap.querySelector(".arch-header-row");
  wrap.innerHTML = "";
  wrap.appendChild(header);
  archs.forEach((a) => {
    const wr = a.games > 0 ? Math.round((a.wins / a.games) * 100) : 0;
    const color = wrColor(wr);
    const row = document.createElement("div");
    row.className = "arch-row";
    row.innerHTML = `<div class="arch-dot" style="background:${color}"></div><div class="arch-name">${a.name}</div><div class="arch-bar-wrap"><div class="arch-bar-bg"><div class="arch-bar-fill" style="width:${wr}%; background:${color}"></div></div></div><div class="arch-pct" style="color:${color}">${wr}</div><div class="arch-count">${a.count}</div>`;
    wrap.appendChild(row);
  });
}
function renderPieChart(archs) {
  const canvas = el("pieCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 20;
  const TOPN = 8;
  const top = archs.slice(0, TOPN);
  const rest = archs.slice(TOPN);
  const totalAll = archs.reduce((s, a) => s + a.count, 0) || 1;
  const othersCount = rest.reduce((s, a) => s + a.count, 0);
  const slices =
    othersCount > 0 ? [...top, { name: "Otros", count: othersCount }] : top;
  const OTHERSCOLOR = "#555";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let angle = -Math.PI / 2;
  slices.forEach((a, i) => {
    const color = i < TOPN ? ARCHCOLORS[i % ARCHCOLORS.length] : OTHERSCOLOR;
    const slice = (a.count / totalAll) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (slice > 0.18) {
      const mid = angle + slice / 2;
      const lx = cx + Math.cos(mid) * r * 0.62;
      const ly = cy + Math.sin(mid) * r * 0.62;
      const pct = Math.round((a.count / totalAll) * 100);
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px Barlow Condensed, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pct + "%", lx, ly);
    }
    angle += slice;
  });
  const legend = el("pieLegend");
  if (legend)
    legend.innerHTML = slices
      .map((a, i) => {
        const color =
          i < TOPN ? ARCHCOLORS[i % ARCHCOLORS.length] : OTHERSCOLOR;
        const pct = Math.round((a.count / totalAll) * 100);
        return `<div class="pie-legend-item"><span class="pie-legend-dot" style="background:${color}"></span><span class="pie-legend-name">${a.name}</span><span class="pie-legend-stat">${pct}% · ${a.count}</span></div>`;
      })
      .join("");
}
function renderTournaments(tournaments) {
  const grid = req("weekGrid");
  grid.innerHTML = "";
  tournaments.forEach((group, wi) => {
    const entries = [...group.entries].sort(
      (a, b) => Number(a.Puesto) - Number(b.Puesto),
    );
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);
    const posClass = (pi) =>
      pi === 0 ? "gold" : pi === 1 ? "silver" : pi === 2 ? "bronze" : "";
    const makeRow = (e, pi) => {
      const name = (e.Nombre || "")
        .replace(/\./g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 2)
        .join(" ");
      return `<div class="podium-row"><div class="podium-pos ${posClass(pi)}">${e.Puesto}</div><div class="podium-info"><div class="podium-name">${name}</div><div class="podium-deck">${e.Arquetipo}</div></div><div class="podium-pts">${e.Puntos}</div></div>`;
    };
    const uid = `week-extra-${wi}`;
    const card = document.createElement("div");
    card.className = "week-card";
    card.innerHTML = `<div class="week-card-header"><div class="week-card-title">${group.label}</div><div class="week-card-meta">${formatDate(group.key)}<br>${entries.length} jugadores</div></div><div class="week-podium">${top3.map((e, pi) => makeRow(e, pi)).join("")}${rest.length > 0 ? `<div id="${uid}" class="week-extra is-collapsed">${rest.map((e, pi) => makeRow(e, pi + 3)).join("")}</div>` : ""}</div>${rest.length > 0 ? `<button class="btn-ver-mas" data-uid="${uid}" data-count="${rest.length}">Ver más (${rest.length})</button>` : ""}`;
    grid.appendChild(card);
  });
}
function renderFacts(archs, mostConsistent, bestAvg, tournaments) {
  const topArch = archs[0];
  const last = tournaments[tournaments.length - 1];
  const prev = tournaments.slice(0, -1);
  const newPlayers = last
    ? [
        ...new Set(
          last.entries
            .map((r) => r.Nombre)
            .filter(
              (n) => !prev.some((t) => t.entries.some((r) => r.Nombre === n)),
            ),
        ),
      ]
    : [];
  const facts = [
    {
      label: "Arquetipo más popular",
      value: topArch ? topArch.name.split(" ").slice(-1)[0] : "—",
      desc: topArch
        ? `${topArch.name} fue jugado ${topArch.count} veces`
        : "Sin datos",
    },
    {
      label: "Jugador más consistente",
      value: mostConsistent ? mostConsistent.name.split(" ")[0] : "—",
      desc: mostConsistent
        ? `Promedio de puesto ${bestAvg.toFixed(1)} en ${mostConsistent.entries.length} torneos`
        : "Sin datos suficientes",
    },
    {
      label: `Nuevos en T${tournaments.length}`,
      value: newPlayers.length || 0,
      desc:
        newPlayers.length > 0
          ? `${newPlayers.map((n) => n.split(" ")[0]).join(", ")} se incorporaron en el último torneo`
          : "Sin jugadores nuevos en el último torneo",
    },
  ];
  req("factsGrid").innerHTML = facts
    .map(
      (f) =>
        `<div class="fact-card"><div class="fact-label">${f.label}</div><div class="fact-value">${f.value}</div><div class="fact-desc">${f.desc}</div></div>`,
    )
    .join("");
}
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loadingScreen");
  const seasonScreen = document.getElementById("seasonSelect");
  const dashboard = document.getElementById("dashboard");
  const buttons = document.querySelectorAll(".btn-season");

  // 1) Ocultar loading y mostrar portada
  if (loadingScreen) loadingScreen.style.display = "none";
  if (seasonScreen) seasonScreen.style.display = "block";
  if (dashboard) {
    dashboard.classList.remove("visible");
    dashboard.style.display = "none";
  }

  // 2) Listeners de los botones
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const season = btn.dataset.season;
      setSeason(season);

      await init(); // carga el JSON

      if (seasonScreen) seasonScreen.style.display = "none";
      if (dashboard) {
        dashboard.style.display = "block";
        dashboard.classList.add("visible");
      }
    });
  });
});
