# Todo Freak Store · Season 3 Dashboard

Dashboard estático para visualizar la Season 3 de torneos de Magic: The Gathering en Todo Freak Store, con foco en standings acumulados, asistencia, rendimiento y arquetipos, usando un solo JSON central (`data/season3.json`).

---

## Características principales

- **Carga única de datos** desde `data/season3.json`.
- **Filtro por torneo/fecha** mediante un dropdown:
  - Opción `Todos los torneos`.
  - Una opción por cada fecha de torneo encontrada en el JSON.
- **Filtro de Top N por Arquetipos**: selector integrado en la sección de Arquetipos para visualizar solo los mazos que aparecieron en las mejores N posiciones de cada torneo (Top 4 / Top 8 / Top 16).
- **Vista única depurada** (sin tabs ni vistas duplicadas):
  - Ranking acumulado histórico/filtrado.
  - Tabla de jugadores con asistencia y rendimiento.
  - Ranking final con bonus por asistencia.
  - Arquetipos (meta) filtrados por top N posiciones.
  - Gráfico de torta con distribución de arquetipos (top N por torneo).
  - Resultados por torneo (cards por fecha).
  - Datos curiosos.

---

## Estructura de la UI

En orden de aparición:

1. **Pantalla de carga**
   - Logo "TODO FREAK S3".
   - Spinner y texto "Cargando dashboard".
   - Desaparece al cargar los datos correctamente.

2. **Pantalla de error**
   - Muestra un mensaje si falla la carga de `data/season3.json`.
   - Texto guía para verificar archivo y servidor local.

3. **Header**
   - Título: `STANDINGS / DASHBOARD`.
   - Subtítulo: `Todo Freak Store · Season 3`.
   - Panel derecho (`#headerMeta`) con:
     - Filtro actual (Todos o fecha).
     - Cantidad de torneos.
     - Jugadores únicos.
     - Rango de fechas.

4. **Selector de torneo/fecha**
   - Barra sticky con label "Torneo" y `<select id="weekDropdown">`.
   - Opciones generadas desde las fechas únicas del JSON.

5. **Ranking Final**
   - Título + tag `PTS + ASISTENCIA + BONUS`.
   - Fórmula: `Pts Totales + Asistencias + Bonus` con `+1 pt por cada 4 asistencias`.
   - Tabla (`#finalRankBody`) con:
     - Jugador.
     - Pts Torneo.
     - Asistencias.
     - Bonus Asistencia.
     - Pts Final (badge, resaltando al líder).

6. **Jugadores · Rendimiento**
   - Tabla (`#playerTableBody`) con columnas:
     - Jugador.
     - W·D·L total.
     - Mejor puesto.

7. **Arquetipos (Top N)**
   - Título: `Arquetipos` + selector inline `<select id="topFilter">` con opciones Top 4 / Top 8 / Top 16.
   - Al cambiar el selector, recalcula y rerenderiza la tabla y el gráfico.
   - Grid (`#archetypeGrid`) con encabezados **Mazo · Rendimiento · Cantidad** y filas con:
     - Color dot del arquetipo.
     - Nombre del mazo.
     - Barra de winrate.
     - % WR coloreado según desempeño.
     - Cantidad de veces que apareció en el top N.

8. **Gráfico de torta (Meta)**
   - Canvas (`#pieCanvas`) con distribución porcentual de arquetipos.
   - Calcula solo con los registros del top N de **cada torneo individualmente**.
   - Leyenda debajo (`#pieLegend`) con color, nombre, porcentaje y conteo.
   - Etiquetas de porcentaje dentro de cada sector (si el slice es suficientemente grande).

9. **Resultados por Torneo**
   - Grid de tarjetas (`#weekGrid`), una por cada fecha/torneo:
     - Header con `Torneo N`, fecha y cantidad de jugadores.
     - Top 3 con posición, nombre, arquetipo y puntos.
     - Resto de posiciones colapsable con botón "Ver más / Ocultar".

10. **Datos Curiosos**
    - Cards (`#factsGrid`) con:
      - Arquetipo más popular.
      - Jugador más consistente.
      - Nuevos jugadores en el último torneo.

11. **Footer**
    - Texto: `Todo Freak Store · Season 3 · Magic: The Gathering · Dashboard generado automáticamente`.

---

## Lógica de datos

### Carga y normalización

- `DATA_FILE = "data/season3.json"`.
- `allData`: arreglo base con todos los registros del JSON.
- `selectedDate`: `"all"` o una fecha `YYYY-MM-DD`.
- `selectedTop`: número entero (`4`, `8` o `16`), por defecto `8`.
- `normalizeDate(row.Fecha)`: usa los primeros 10 caracteres para trabajar con fechas consistentes.

### Filtros

- `getFilteredData()`:
  - Si `selectedDate === "all"` → devuelve `allData`.
  - Si no, filtra por `normalizeDate(row.Fecha) === selectedDate`.

- `getUniqueDates(allData)`:
  - Saca fechas únicas, filtra falsy, ordena alfabéticamente.

### Agrupaciones y cálculos

- `groupByTournament(data)`:
  - Agrupa por fecha.
  - Ordena fechas.
  - Para cada grupo arma `key`, `label` y `entries` ordenadas por `Puesto`.

- En `renderAcumView()` se calculan:
  - `players`: puntos totales, W/D/L, mejor puesto y arquetipos usados por jugador.
  - `tournaments`: grupos por fecha/torneo a partir de `raw`.
  - `topNPerTournament`: aplana los registros cuyo `Puesto <= selectedTop` de **cada torneo por separado**, usando `tournaments.flatMap(group => group.entries.filter(r => Number(r.Puesto) <= selectedTop))`.
  - `archs`: conteo de arquetipos, partidas y wins para winrate, calculado sobre `topNPerTournament`.
  - `finalPlayers`: `finalPts = totalPts + asistencias + bonus`, ordenados por `finalPts` descendente.
  - `facts`: arquetipo más jugado, jugador más consistente, nuevos jugadores en el último torneo.

### Filtro Top N — comportamiento

| Escenario | Resultado |
|---|---|
| "Todos los torneos" + Top 8 | Top 8 de **cada** torneo, todos combinados |
| Torneo individual + Top 4 | Solo los 4 primeros puestos de ese torneo |
| Torneo con menos de N jugadores | Toma todos los disponibles |

---

## Decisiones de diseño y depuración

- Eliminada la lógica de múltiples vistas (`viewAcum` / `viewWeek`) basada en tabs.
- Eliminado el bloque HTML redundante de "Resultados" y "Arquetipos · TORNEO SELECCIONADO".
- Eliminadas funciones JS: `setView()`, `renderWeekView()`, `currentView` y referencias a tabs.
- Reemplazo del sistema de `WEEKS` + múltiples JSON individuales por un solo `season3.json` con dropdown por fechas.
- El filtro Top N usa `Puesto` del JSON directamente, no posición relativa en el array, para evitar bugs con datos desordenados.
- El selector `#topFilter` vive dentro del `section-title` de Arquetipos para mantener la relación visual directa con lo que controla.
- El gráfico de torta y la tabla de arquetipos comparten el mismo `archs` calculado — cambiar el selector actualiza ambos simultáneamente.

---

## Estilos y preset visual

- Tema **oscuro**, amarillo como color principal.
- Tipografías:
  - `Bebas Neue` para títulos y números grandes.
  - `Barlow` y `Barlow Condensed` para texto y labels.
- Fondo con patrón diagonal suave.
- Componentes principales:
  - Tarjetas con bordes, clips y barras animadas.
  - Badges recortados para asistencia/bonus/puntos.
  - Tablas estilizadas para standings.
  - Gráfico de torta con Canvas API nativo (sin librerías externas).

---

## Estructura de archivos

```
MTG-Todo-Freak/
├── index.html          # Dashboard completo (HTML + CSS + JS en un solo archivo)
└── data/
    └── season3.json    # Datos de todos los torneos de la Season 3
```

---

## Estructura del JSON (`season3.json`)

El archivo debe ser un arreglo de objetos con la siguiente estructura:

```json
[
  {
    "Fecha": "2025-03-15",
    "Puesto": 1,
    "Nombre": "Nombre Jugador",
    "Arquetipo": "Temur Prowess",
    "Puntos": 12,
    "V": 4,
    "E": 0,
    "D": 1
  }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `Fecha` | `string` (YYYY-MM-DD) | Fecha del torneo |
| `Puesto` | `number` | Posición final del jugador |
| `Nombre` | `string` | Nombre del jugador |
| `Arquetipo` | `string` | Nombre del mazo |
| `Puntos` | `number` | Puntos obtenidos en el torneo |
| `V` | `number` | Victorias |
| `E` | `number` | Empates |
| `D` | `number` | Derrotas |

---

## Cómo correr el dashboard

1. Colocar `index.html` y `data/season3.json` en el mismo proyecto.
2. Levantar un servidor local:
   ```bash
   npx serve .
   # o con VS Code: botón Live Server
   ```
3. Abrir el HTML en el navegador.

> ⚠️ El dashboard **no funciona abriendo el HTML directamente** como archivo local (`file://`) porque el fetch a `season3.json` es bloqueado por el navegador. Siempre usar servidor local.

---

*© Todo Freak Store · Season 3 · Magic: The Gathering*
