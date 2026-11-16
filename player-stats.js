(() => {
  // Agrega aquí las próximas temporadas cuando estén disponibles.
  const SEASONS = [1, 2, 3, 4, 5];

  const INITIAL_SEASON = String(SEASONS[SEASONS.length - 1]);

  const number = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Unifica espacios y mayúsculas, sin eliminar acentos ni apellidos.
  const clean = (value) =>
    String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();

  const key = (value) => clean(value).toLocaleLowerCase("es-CL");

  const decimal = (value) =>
    value.toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  document.addEventListener("DOMContentLoaded", async () => {
    const playerSelect = document.getElementById("playerStatsPlayer");
    const seasonSelect = document.getElementById("playerStatsSeason");
    const status = document.getElementById("playerStatsStatus");
    const cards = document.getElementById("playerStatsCards");

    if (!playerSelect || !seasonSelect || !status || !cards) return;

    seasonSelect.replaceChildren(
      ...SEASONS.map((season) =>
        new Option(`Season ${season}`, String(season))
      ),
      new Option("General · Todas las temporadas", "all")
    );

    seasonSelect.value = INITIAL_SEASON;

    let records = [];
    const playerNames = new Map();

    function addCard(label, value, description) {
      const card = document.createElement("div");
      card.className = "fact-card";

      for (const [className, text] of [
        ["fact-label", label],
        ["fact-value", value],
        ["fact-desc", description],
      ]) {
        const element = document.createElement("div");
        element.className = className;
        element.textContent = String(text);
        card.appendChild(element);
      }

      cards.appendChild(card);
    }

    function summarize(rows) {
      const result = {
        tournaments: rows.length,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };

      rows.forEach((row) => {
        result.points += number(row.Puntos);
        result.wins += number(row.V);
        result.draws += number(row.E);
        result.losses += number(row.D);
      });

      result.matches = result.wins + result.draws + result.losses;
      result.average = result.tournaments
        ? result.points / result.tournaments
        : 0;

      result.winRate = result.matches
        ? (result.wins / result.matches) * 100
        : null;

      return result;
    }

    function render() {
      cards.replaceChildren();

      if (!playerSelect.value) {
        status.textContent = "Selecciona un jugador para ver su ficha.";
        return;
      }

      const selectedSeason = seasonSelect.value;

      const rows = records.filter(
        (row) =>
          key(row.Nombre) === playerSelect.value &&
          (selectedSeason === "all" ||
            row.statsSeason === Number(selectedSeason))
      );

      if (!rows.length) {
        status.textContent =
          "Este jugador no tiene participaciones en la temporada consultada.";
        return;
      }

      const period =
        selectedSeason === "all"
          ? "General · Todas las temporadas"
          : `Season ${selectedSeason}`;

      status.textContent =
        `${playerNames.get(playerSelect.value)} · ${period}`;

      const totals = summarize(rows);

      addCard(
        "Promedio de puntos por torneo",
        decimal(totals.average),
        `${totals.points} puntos / ${totals.tournaments} torneos`
      );

      addCard(
        "Torneos jugados",
        totals.tournaments,
        period
      );

      addCard(
        "Puntos obtenidos",
        totals.points,
        "Sin asistencia, bonos ni multiplicadores"
      );

      addCard(
        "Win rate",
        totals.winRate === null ? "—" : `${decimal(totals.winRate)}%`,
        `${totals.wins} V · ${totals.draws} E · ${totals.losses} D`
      );

      const deckGroups = new Map();

      rows.forEach((row) => {
        const name = clean(row.Arquetipo);
        if (!name) return;

        const deckKey = key(name);

        if (!deckGroups.has(deckKey)) {
          deckGroups.set(deckKey, { name, rows: [] });
        }

        deckGroups.get(deckKey).rows.push(row);
      });

      const decks = [...deckGroups.values()]
        .map((deck) => ({
          name: deck.name,
          ...summarize(deck.rows),
        }))
        .filter((deck) => deck.matches > 0)
        .sort(
          (a, b) =>
            b.winRate - a.winRate ||
            b.matches - a.matches ||
            b.average - a.average ||
            a.name.localeCompare(b.name, "es")
        );

      const best = decks[0];

      addCard(
        "Mazo con mejor rendimiento",
        best ? best.name : "Sin datos",
        best
          ? `${decimal(best.winRate)}% WR · ` +
            `${best.tournaments} torneos · ${best.matches} encuentros · ` +
            `${decimal(best.average)} pts/torneo`
          : "No hay arquetipos con encuentros registrados"
      );
    }

    try {
      // Si falla una temporada, no mostramos un General incompleto.
      const datasets = await Promise.all(
        SEASONS.map(async (season) => {
          const response = await fetch(`data/season${season}.json`);

          if (!response.ok) {
            throw new Error(
              `Season ${season}: HTTP ${response.status}`
            );
          }

          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error(`Season ${season}: se esperaba un arreglo`);
          }

          return data.map((row) => ({
            ...row,
            statsSeason: season,
          }));
        })
      );

      records = datasets.flat().filter((row) => clean(row.Nombre));

      records.forEach((row) => {
        const playerKey = key(row.Nombre);

        if (!playerNames.has(playerKey)) {
          playerNames.set(playerKey, clean(row.Nombre));
        }
      });

      const sortedPlayers = [...playerNames.entries()].sort(
        (a, b) => a[1].localeCompare(b[1], "es")
      );

      playerSelect.replaceChildren(
        new Option("Selecciona un jugador", ""),
        ...sortedPlayers.map(([value, name]) => new Option(name, value))
      );

      playerSelect.disabled = false;
      seasonSelect.disabled = false;

      playerSelect.addEventListener("change", render);
      seasonSelect.addEventListener("change", render);

      render();
    } catch (error) {
      console.error("Estadísticas de jugador:", error);

      status.textContent =
        "No se pudieron cargar todas las temporadas. " +
        "Revisa la consola y los archivos de data/.";
    }
  });
})();