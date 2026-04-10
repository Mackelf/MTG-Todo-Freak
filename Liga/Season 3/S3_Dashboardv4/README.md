# S3 · Season 3 Dashboard

Dashboard de clasificación para la liga semanal de Magic: The Gathering de **Todo Freak Store**, temporada 3.

---

## 📁 Estructura del proyecto

```
s3-dashboard/
├── index.html          ← Dashboard principal
├── README.md
└── data/
    ├── week1.json      ← Resultados semana 1
    ├── week2.json      ← Resultados semana 2
    ├── week3.json      ← Resultados semana 3
    ├── week4.json      ← Resultados semana 4
    ├── week5.json      ← Resultados semana 5
    └── ...             ← Agrega más cada semana
```

---

## 🚀 Publicar en GitHub Pages

1. Crea un repositorio en GitHub (ej: `s3-dashboard`)
2. Sube todos los archivos (index.html + carpeta data/)
3. Ve a **Settings → Pages**
4. En *Branch*, selecciona `main` y carpeta `/ (root)`
5. Guarda — en 1-2 minutos estará disponible en:
   `https://TU-USUARIO.github.io/s3-dashboard/`

---

## ➕ Agregar una nueva semana

1. Crea el archivo `data/weekN.json` con los resultados (reemplaza N por el número)
2. Abre `index.html` y edita el array `WEEKS` al inicio del script:

```js
const WEEKS = [
  { label: 'Week 1', file: 'data/week1.json' },
  { label: 'Week 2', file: 'data/week2.json' },
  // Agrega la nueva semana:
  { label: 'Week 6', file: 'data/week6.json' },
];
```

3. Sube los cambios al repositorio — GitHub Pages se actualiza automáticamente.

---

## 📋 Formato del JSON

Cada archivo de semana es un array de objetos con esta estructura:

```json
[
  {
    "Puesto": 1,
    "Nombre": "Nombre Apellido",
    "Arquetipo": "Nombre del Deck",
    "Puntos": 9,
    "Fecha": "2025-01-10",
    "V": "3",
    "E": "0",
    "D": "0",
    "%JG": "100"
  }
]
```

| Campo     | Descripción                        |
|-----------|------------------------------------|
| `Puesto`  | Posición final en el torneo (1, 2…)|
| `Nombre`  | Nombre completo del jugador        |
| `Arquetipo` | Nombre del mazo                  |
| `Puntos`  | Puntos obtenidos                   |
| `Fecha`   | Fecha del torneo (`YYYY-MM-DD`)    |
| `V`       | Victorias                          |
| `E`       | Empates                            |
| `D`       | Derrotas                           |
| `%JG`     | Porcentaje de juegos ganados (0-100)|

---

## 🖥️ Desarrollo local

Para probar localmente (necesitas un servidor, no abrir el HTML directo):

```bash
# Con Node.js
npx serve .

# Con Python
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador.

---

## ✨ Funcionalidades

- **Dropdown selector** de semana — muestra resultados individuales por torneo
- **Vista Acumulada** — ranking total con todas las semanas sumadas
- **Vista Esta Semana** — resultados y arquetipos del torneo seleccionado
- Ranking Final con fórmula: `Pts + Asistencias + Bonus (÷4)`
- Barras animadas, arquetipos con win rate, datos curiosos
- 100% responsive — funciona en móvil
