## 🏷️ **Branding-Übersicht**

| Element                 | Vorschlag                                                                                              | Bedeutung                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Name**                | **ParFormance**                                                                                        | „Par“ + „Performance“ – Ziel ist, besser zu spielen, nicht perfekt zu sein |
| **Slogan**              | *„Train smart. Play par.“*                                                                             | kurz, rhythmisch, motivierend                                              |
| **Alternative Slogans** | - *„From practice to Par.“*  <br> - *„Every swing counts.“*  <br> - *„Golf smarter, not harder.“*      |                                                                            |
| **Logo-Idee**           | minimalistisches **P** mit integriertem Golfball / Schwungbogen → modern & klar                        |                                                                            |
| **Tonfall**             | freundlich, sportlich, leicht augenzwinkernd (ähnlich wie „handycap“)                                  |                                                                            |
| **App-Voice**           | positiv, aber nicht übermotiviert („Let’s roll some putts!“, „Nice session – one step closer to Par!“) |                                                                            |

---

## 🎨 **Designsystem**

### 🎯 Farbpalette

| Farbe                 | Hex       | Bedeutung                                                |
| --------------------- | --------- | -------------------------------------------------------- |
| **Fairway Green**     | `#2F7A52` | zentrales Marken-Grün – naturverbunden, ruhig, sportlich |
| **Sand Bunker Beige** | `#E8DCC4` | weiche Akzentfarbe für Hintergründe & Karten             |
| **Sky Blue**          | `#A7D8FF` | Frische und Leichtigkeit (Akzent für Buttons / Chips)    |
| **Iron Grey**         | `#444C56` | Textfarbe für Kontrast und Eleganz                       |
| **Pure White**        | `#FFFFFF` | Klarheit, Leichtigkeit – Haupt-Background                |

**Tipp für Theme:**
Dark Mode → invertiert `Fairway Green` ↔ `Bunker Beige`, `Iron Grey` wird hellgrau.

---

### ✨ Typografie

* **Primary Font:** [Poppins](https://fonts.google.com/specimen/Poppins) – modern, freundlich, geometrisch
* **Alternative (neutraler):** Inter
* Headings: *SemiBold*, Buttons: *Uppercase*, Body: *Regular*

---

### 🧩 UI-Stil

* Kacheln mit weichen Schatten (`box-shadow: 0 2px 6px rgba(0,0,0,0.08)`),
* Buttons leicht abgerundet (`border-radius: 8px`),
* Farbakzente nur dort, wo Aktion passiert (keine „grünen Flächen“ überall),
* Chips farbcodiert nach Kategorie:

    * Putting → `#A7D8FF`
    * Chipping → `#B6E5C0`
    * Driving → `#FFD37A`
    * Irons → `#EABFFF`
    * Bunker → `#F7C7A3`

---

## 🧠 **App-Identity / Story**

> **ParFormance** ist dein smarter Trainingspartner für’s Golfspiel.
> Statt „Drill um Drill“ einfach stumpf abzuarbeiten, geht’s um bewusste, spielnahe Übung – mit Spaß, Zufall und Feedback.
> Jede Session bringt dich näher an dein Ziel: **Par – deine persönliche Performance.**

💬 Kurztext für App Store:

> *Train smart. Play par.*
> Mit ParFormance machst du aus jeder Einheit ein Spiel: zufällige Drills, klare Ziele, messbare Fortschritte.
> Von Putting über Chipping bis Driving – deine Routine, dein Rhythmus, dein Par.

---

## 📱 **Icon-Idee**

Ein minimalistisches Flat-Icon:

* Kreisförmig (wie Golfball / Par-Ziel),
* Buchstabe **P** leicht kursiv, in `Fairway Green`,
* diagonal verlaufende Linie symbolisiert **Schwungbahn**,
* helles `Sky Blue` als Hintergrund.

Optionale Varianten:

* mit Ball-Schatten für App-Store-Icon
* monochrom für Splash-Screen & Toolbar

---

## 🧩 Integration in deine App

In `App.vue` oder globaler Header:

```vue
<h1 class="brand">ParFormance</h1>
<p class="tagline">Train smart. Play par.</p>
```

CSS:

```css
.brand {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: var(--accent-green, #2F7A52);
}
.tagline {
  font-size: 0.9rem;
  color: var(--muted, #666);
  margin-top: -4px;
}
```
