# Todo Freak Store · Season 3 Dashboard

Dashboard estático para visualizar la Season 3 de torneos de Magic: The Gathering en Todo Freak Store, con foco en standings acumulados, asistencia, rendimiento y arquetipos, usando un solo JSON central (`data/season3.json`). [file:55]

## Características principales

- **Carga única de datos** desde `data/season3.json`.  
- **Filtro por torneo/fecha** mediante un dropdown:
  - Opción `Todos los torneos`.
  - Una opción por cada fecha de torneo encontrada en el JSON. [file:55]
- **Vista única depurada** (sin tabs ni vistas duplicadas):
  - Ranking acumulado histórico/filtrado.
  - Tabla de jugadores con asistencia y rendimiento.
  - Ranking final con bonus por asistencia.
  - Arquetipos (meta) de la vista actual.
  - Resultados por torneo (cards por fecha).
  - Datos curiosos. [file:55]

## Estructura de la UI

En orden de aparición dentro de `paste.txt`: [file:55]

1. **Pantalla de carga**
   - Logo “TODO FREAK S3”.
   - Spinner y texto “Cargando dashboard”.
   - Desaparece al cargar los datos correctamente. [file:55]

2. **Pantalla de error**
   - Muestra un mensaje si falla la carga de `data/season3.json`.
   - Texto guía para verificar archivo y servidor local. [file:55]

3. **Header**
   - Título: `STANDINGS / DASHBOARD`.
   - Subtítulo: `Todo Freak Store · Season 3`.
   - Panel derecho (`#headerMeta`) con:
     - Filtro actual (Todos o fecha).
     - Cantidad de torneos.
     - Jugadores únicos.
     - Rango de fechas. [file:55]

4. **Selector de torneo/fecha**
   - Barra sticky con label “Torneo” y `<select id="weekDropdown">`.
   - Opciones generadas desde las fechas únicas del JSON. [file:55]

5. **Resumen de stats (`#statsRow`)**
   - Tarjetas con:
     - Jugadores.
     - Torneos.
     - Arquetipos.
     - Jugador más consistente, etc. (según datos calculados). [file:55]

6. **Ranking Acumulado**
   - Título: `Ranking Acumulado` + tag (`Histórico completo` o fecha filtrada).
   - Lista de barras (`.cumul-row`) con:
     - Posición.
     - Nombre del jugador.
     - Cantidad de torneos jugados.
     - Puntos acumulados (y barra animada proporcional). [file:55]

7. **Jugadores · Asistencia y Rendimiento**
   - Tabla (`#playerTableBody`) con columnas:
     - Jugador.
     - Asistencias (badge).
     - Pts Totales.
     - W·D·L total (dibujo de dots).
     - %JG (win rate) promedio.
     - Mejor puesto. [file:55]

8. **Ranking Final**
   - Título + tag `PTS + ASISTENCIA + BONUS`.
   - Fórmula: `Pts Totales + Asistencias + Bonus` con `+1 pt por cada 4 asistencias`.  
   - Tabla (`#finalRankBody`) con:
     - Jugador.
     - Pts Torneo.
     - Asistencias.
     - Bonus Asistencia.
     - Pts Final (badge, resaltando al líder). [file:55]

9. **Arquetipos (Vista actual)**
   - Título: `Arquetipos · VISTA ACTUAL`.
   - Grid (`#archetypeGrid`) con filas:
     - Color de arquetipo.
     - Nombre.
     - Barra de winrate.
     - %WR coloreado según desempeño.
     - Cantidad de veces jugado. [file:55]

10. **Resultados por Torneo**
    - Título: `Resultados por Torneo`.
    - Grid de tarjetas (`#weekGrid`), una por cada fecha/torneo:
      - Header con `Torneo N` y fecha + cantidad de jugadores.
      - Top 3 con posición, nombre, arquetipo y puntos.
      - Resto de posiciones colapsable con botón “Ver más / Ocultar”. [file:55]

11. **Datos Curiosos**
    - Título: `Datos Curiosos`.
    - Cards (`#factsGrid`) con:
      - Arquetipo más popular.
      - Jugador más consistente.
      - Nuevos jugadores en el último torneo, etc. [file:55]

12. **Footer**
    - Texto: `Todo Freak Store · Season 3 · Magic: The Gathering · Dashboard generado automáticamente`. [file:55]

## Lógica de datos

### Carga y normalización

- `DATA_FILE = "data/season3.json"`.
- `allData`: arreglo base con todos los registros del JSON.
- `selectedDate`: `"all"` o una fecha `YYYY-MM-DD`.  
- `normalizeDate(row.Fecha)`: usa los primeros 10 caracteres para trabajar con fechas consistentes. [file:55]

### Filtro

- `getUniqueDates(allData)`:  
  - Saca fechas únicas.
  - Filtra falsy.
  - Ordena alfabéticamente. [file:55]

- `getFilteredData()`:
  - Si `selectedDate === "all"` → devuelve `allData`.
  - Si no, filtra por `normalizeDate(row.Fecha) === selectedDate`. [file:55]

### Agrupaciones y cálculos

- `groupByTournament(data)`:
  - Agrupa por fecha.
  - Ordena fechas.
  - Para cada grupo arma:
    - `key` (fecha).
    - `label` (`Torneo 1`, `Torneo 2`, ...).
    - `entries` ordenadas por `Puesto`. [file:55]

- En `renderAcumView()` se calculan:
  - `players`:
    - Total de puntos por jugador.
    - W/D/L totales.
    - Mejor puesto.
    - Listado de arquetipos usados. [file:55]
  - `archs`:
    - Conteo de arquetipos.
    - Partidas y wins para winrate. [file:55]
  - `finalPlayers`:
    - `finalPts = totalPts + asistencias + bonus`.
    - Ordenados por `finalPts` descendente. [file:55]
  - `facts`:
    - Arquetipo más jugado.
    - Jugador más consistente (mejor promedio de puesto con mínimo 2 torneos).
    - Nuevos jugadores en el último torneo. [file:55]

## Decisiones de depuración

Cambios claves que hicimos respecto a versiones anteriores:

- Eliminada la lógica de múltiples vistas (`viewAcum` / `viewWeek`) basada en tabs. [file:54][file:55]
- Eliminado el bloque HTML redundante:
  - `Resultados` (vista de torneo seleccionado).
  - `Arquetipos · TORNEO SELECCIONADO`. [file:54]
- Eliminadas funciones JS asociadas a esa vista:
  - `setView(...)`, `renderWeekView(...)`, `currentView`, y referencias a `weekViewTag`, `weekDetailPodium`, `weekArchGrid`, `tabAcum`, `tabWeek`. [file:54][file:55]
- Reemplazo del sistema de `WEEKS` + múltiples JSON individuales por:
  - un solo archivo `season3.json`,
  - más un dropdown alimentado por fechas reales de los datos. [file:55]
- Limpieza de duplicidad de secciones (“Resultados” y “Arquetipos” extra) para dejar:
  - Ranking Acumulado.
  - Jugadores.
  - Ranking Final.
  - Arquetipos.
  - Resultados por Torneo.
  - Datos Curiosos. [file:55]

## Estilos y preset visual

- Tema **oscuro**, con amarillo como color principal, tipografías:
  - `Bebas Neue` para títulos y números grandes.
  - `Barlow` y `Barlow Condensed` para texto y labels. [file:55]
- Fondo con patrón diagonal suave.
- Componentes principales:
  - Tarjetas con bordes, clips, y barras animadas.
  - Badges recortados para asistencia/bonus/puntos.
  - Tablas estilizadas para standings. [file:55]
- Se aplicó un **preset de refinado visual** al final del CSS:
  - Ajustes de padding, tamaños de fuente, separación entre secciones.
  - Bordes más sutiles.
  - Secciones más compactas y limpias, manteniendo el carácter competitivo. [file:55]

## Cómo correr el dashboard

1. Colocar el archivo HTML y `data/season3.json` en un mismo proyecto. [file:55]
2. Levantar un servidor local (por ejemplo, con VS Code Live Server o `npx serve`). [file:55]
3. Abrir el HTML en el navegador.
4. Si `data/season3.json` no se carga:
   - La pantalla de error indica revisar:
     - que el archivo exista en `data/season3.json`,
     - que el proyecto se esté abriendo con servidor local. [file:55]

---

Este README resume el estado actual depurado. Si quieres, puedo agregar una sección con **ejemplo de estructura del JSON** (`season3.json`) para documentar cómo debes exportar los torneos desde tu fuente de datos.