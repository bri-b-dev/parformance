import {defineStore} from 'pinia';
import type {Drill, DrillCategory} from '@/types/drills';
import {Preferences} from '@capacitor/preferences';


const defaultDrills: Omit<Drill, 'id' | 'updatedAt'>[] = [
    {
        title: 'Circle Chips',
        category: 'chipping',
        difficulty: 2,
        durationMin: 10,
        description:
            'Lege 6 Bälle im Kreis rund ums Loch, jeweils etwa 2–3 m entfernt. Spiele jeden Ball mit identischem Rhythmus und gleicher Technik, sodass der Ballflug und der Rollanteil übereinstimmen. Ziel ist, dass alle Bälle innerhalb eines Schlägerkopfs um das Loch liegen. Konzentriere dich auf den Treffpunkt und den Rhythmus deiner Bewegung.',
        tags: ['accuracy', 'rhythm', 'control']
    },
    {
        title: 'One Club Challenge',
        category: 'chipping',
        difficulty: 3,
        durationMin: 15,
        description:
            'Spiele eine komplette Chip-Einheit ausschließlich mit einem Schläger, z. B. dem PW oder 9er Eisen. Variiere den Ballflug über deinen Stand, das Ball-Setup (vorne/mittig/hinten) und den Öffnungswinkel des Schlägers. Beobachte, wie stark sich der Rollweg verändert. Ziel: Gefühl für Loft und Energieübertragung entwickeln.',
        tags: ['technique', 'feel', 'control']
    },
    {
        title: 'Landezonen-Training',
        category: 'chipping',
        difficulty: 4,
        durationMin: 12,
        description:
            'Markiere drei Landezonen in unterschiedlicher Entfernung (z. B. 2 m, 4 m, 6 m vom Ball). Spiele abwechselnd in jede Zone und versuche, jeweils drei Bälle hintereinander korrekt zu platzieren, bevor du weitergehst. Nutze unterschiedliche Schläger (PW, SW, LW), um den Ballflug anzupassen. Fokus auf Landezonen-Kontrolle, nicht auf das Loch.',
        tags: ['variation', 'decision', 'realplay']
    },
    {
        title: 'Random Chip',
        category: 'chipping',
        difficulty: 3,
        durationMin: 10,
        description:
            'Wirf den Ball zufällig rund ums Grün – jede Lage, jeder Lie ist anders. Spiele jeden Ball mit beliebigem Schläger ans Loch, aber nur **ein Versuch pro Ball**! Simuliert die Varianz realer Spielsituationen und trainiert schnelle Entscheidungsfindung und Gefühl. Ideal zum Abschluss einer Session.',
        tags: ['variation', 'decision', 'realplay']
    },
    {
        title: 'Landing Zone 3×3',
        category: 'chipping',
        difficulty: 2,
        durationMin: 10,
        description:
            'Markiere ein 3×3-Raster aus neun kleinen Landezonen (je ca. 50 cm × 50 cm) rund ums Loch. Spiele pro Feld fünf Bälle. Vergib Punkte je nach Nähe: innerstes Feld = 3 Punkte, mittleres = 2 Punkte, äußeres = 1 Punkt. Gesamtziel: > 60 Punkte. Trainiert Zielgenauigkeit und Distanzkontrolle.',
        tags: ['accuracy', 'scoring', 'target']
    },
    {
        title: 'Putting-Leiter',
        category: 'putting',
        difficulty: 2,
        durationMin: 15,
        description:
            'Lege 5 Markierungen im Abstand von 1 m bis 5 m zur Lochkante. Putte von jeder Station zwei Bälle hintereinander. Beide müssen fallen, um zur nächsten Station zu dürfen; bei Fehlschlag geht’s eine Stufe zurück. Fokus: gleichmäßige Schlaglänge und Tempo. Ideal für Distanzgefühl und Drucksituationen.',
        tags: ['distance', 'rhythm', 'focus']
    },
    {
        title: 'Bunker-Zielkreise',
        category: 'bunker',
        difficulty: 3,
        durationMin: 10,
        description:
            'Lege drei Zielkreise (z. B. 2 m, 4 m, 6 m) aus Seilen oder Markierungen auf das Grün. Schlage je 10 Bälle pro Zielkreis. Punktewertung: 3 Punkte für innerhalb des Kreises, 1 Punkt für auf dem Grün. Ziel: über 20 Punkte gesamt. Fokus: Konstanz beim Eintreffwinkel und Ball-Boden-Kontakt. Beobachte Sandmenge und Schwunglänge.',
        tags: ['accuracy', 'control']
    },
    {
        title: 'Putting — Zielbahn Challenge',
        category: 'putting',
        difficulty: 2,
        durationMin: 12,
        description:
            'Lege eine 3 m lange, 20 cm breite Zielbahn mit Tees oder einem Seil. Putte 10 Bälle so, dass sie auf der Bahn bleiben und über die Lochkante rollen. Wiederhole aus 4 m und 5 m Entfernung. Fokus: präzise Schlagfläche und konstante Schlaglänge. Trainiert Startlinie und Tempo.',
        tags: ['accuracy', 'line', 'control']
    },
    {
        title: 'Putting — Clock Drill',
        category: 'putting',
        difficulty: 3,
        durationMin: 15,
        description:
            'Platziere 12 Bälle im Uhrzeigersinn rund ums Loch, je ca. 1 m Entfernung. Putte einmal rundherum, alle Bälle sollen fallen. Danach erweitere auf 1,5 m und 2 m. Ziel: alle 36 Putts schaffen. Perfekt für kurze Putts und Selbstvertrauen unter Druck.',
        tags: ['focus', 'accuracy', 'control']
    },
    {
        title: 'Putting — Distanzpyramide',
        category: 'putting',
        difficulty: 3,
        durationMin: 18,
        description:
            'Lege Markierungen bei 2 m, 4 m, 6 m und 8 m. Putte je zwei Bälle pro Distanz; beide müssen innerhalb 50 cm vom Loch stoppen, um zur nächsten Stufe zu dürfen. Danach rückwärts zurück zur Startdistanz. Ziel: Tempo- und Rollkontrolle auf unterschiedlichen Distanzen.',
        tags: ['distance', 'feel', 'scoring']
    },
    {
        title: 'Pitching — 10-20-30',
        category: 'irons',
        difficulty: 3,
        durationMin: 15,
        description:
            'Platziere drei Zielbereiche in 10 m, 20 m und 30 m Entfernung. Spiele je 5 Bälle pro Ziel. Punktewertung: 3 Punkte = innerhalb 1 m, 2 Punkte = innerhalb 2 m, 1 Punkt = auf Grün. Ziel: 30 Punkte. Trainiert Distanzkontrolle und Rhythmus. Tipp: gleicher Schwung – nur Grifflänge ändern.',
        tags: ['distance', 'rhythm', 'scoring']
    },
    {
        title: 'Pitching — Trajectory Control',
        category: 'irons',
        difficulty: 4,
        durationMin: 12,
        description:
            'Spiele 9 Bälle mit drei verschiedenen Ballflügen: flach, mittel, hoch. Variiere Stand, Ballposition und Schwunglänge. Beobachte die Flugbahn und den ersten Bodenkontakt. Ziel: bewusste Steuerung des Abflugwinkels. Ideal bei Wind oder Hanglagen.',
        tags: ['technique', 'control']
    },
    {
        title: 'Bunker — Auf einem Fuß',
        category: 'bunker',
        difficulty: 4,
        durationMin: 10,
        description:
            'Lege 5 Bälle im Bunker auf normale Lagen. Schlage sie mit leicht angehobenem vorderen Fuß (Ferse oben). Das zwingt dich zu ruhigem Kopf und stabilem Unterkörper. Ziel: 3 Bälle sauber auf Grün und innerhalb 3 m. Fördert Balance, Rhythmus und Treffmoment.',
        tags: ['balance', 'technique', 'control']
    },
    {
        title: 'Approach — Par-18 Short Game',
        category: 'chipping',
        difficulty: 5,
        durationMin: 20,
        description:
            'Baue 9 Spielbahnen rund ums Grün (verschiedene Distanzen und Lagen). Spiele jede Bahn wie ein Loch: Chip + max. 2 Putts = Par 2. Zähle Gesamtscore. Ziel: 18 oder besser. Simuliert echte Platzsituationen, verbindet Chipping und Putting unter Druck.',
        tags: ['realplay', 'pressure', 'scoring']
    },
    {
        title: 'Putting Basics – Rhythmus & Setup',
        category: 'putting',
        difficulty: 1,
        durationMin: 5,
        description:
            'Kontrolliere Ausrichtung, Körperwinkel und Griffdruck. Stelle dich gleichmäßig auf, Schultern parallel zur Ziellinie. Pendle den Putter mit lockerem Griffdruck und gleichmäßigem Rhythmus. Fokus: saubere Basisbewegung ohne Zielstress.',
        tags: ['technique', 'rhythm']
    },
    {
        title: 'Short Putt Circle',
        category: 'putting',
        difficulty: 2,
        durationMin: 8,
        description:
            'Lege 6 Tees im Kreis um das Loch (1 m Abstand). Versuche alle 6 hintereinander zu lochen. Wiederhole auf 1,5 m und 2 m. Ziel: Konstanz im kurzen Bereich für sichere Pars und Birdies.',
        tags: ['accuracy', 'confidence']
    },
    {
        title: 'Long Putt Progression',
        category: 'putting',
        difficulty: 3,
        durationMin: 8,
        description:
            '10 Bälle aus ca. 10 m Entfernung. Ziel: 8 von 10 Bällen müssen im 2-m-Radius ums Loch liegen. Danach Radius auf 1,5 m und 1 m reduzieren. Fokus: Distanzgefühl entwickeln und Dreiputts vermeiden.',
        tags: ['distance', 'feel', 'control']
    },
    {
        title: 'Distanzkontrolle – Lag Putting Points',
        category: 'putting',
        difficulty: 3,
        durationMin: 10,
        description:
            'Lege 3–5 Tees bei 5 m, 8 m, 12 m Entfernung. Putte je 5 Bälle pro Distanz. Punktewertung: innerhalb 1 Schlägerlänge hinter Loch = 2 Punkte, <1 m davor = 1 Punkt. Ziel: möglichst viele Punkte – Fokus auf Längenkontrolle, nicht Loch.',
        tags: ['distance', 'control', 'tempo']
    },
    {
        title: '3-Zonen Ladder Drill',
        category: 'putting',
        difficulty: 3,
        durationMin: 12,
        description:
            'Hinter dem Loch drei Zonen markieren (0–50 cm, 50–100 cm, 100–150 cm). Putte von 6–10 m. Ziel: Ball muss hinter dem Loch stehen bleiben, je näher desto besser. Punkte wie Darts: Zone 1 = 3 P, Zone 2 = 2 P, Zone 3 = 1 P.',
        tags: ['distance', 'accuracy', 'scoring']
    },
    {
        title: 'Par-Putt-Challenge',
        category: 'putting',
        difficulty: 4,
        durationMin: 15,
        description:
            'Wähle 9 verschiedene Putts (5–15 m, unterschiedliche Breaks). Birdie = direkt gelocht (2 P), Par = Tap-In < 1 Schlägerlänge (1 P), 3-Putt = 0 P. Zähle Gesamtscore. Trainiert Platzdruck & Distanzstrategie.',
        tags: ['strategy', 'pressure', 'realplay']
    },
    {
        title: 'Gate Drill + Distanzkontrolle',
        category: 'putting',
        difficulty: 3,
        durationMin: 10,
        description:
            'Platziere zwei Tees 30 cm vor dem Putter als Gate. Putte zu einem Ziel in 8–10 m. Nur Putts, die durchs Gate gehen und innerhalb 1 m stoppen, zählen. Trainiert Schlagflächenkontrolle & Tempo.',
        tags: ['technique', 'accuracy', 'control']
    },
    {
        title: 'Putting Statistik – Up & Down',
        category: 'putting',
        difficulty: 2,
        durationMin: 10,
        description:
            '10 Putts aus 6–12 m. Zähle, wie viele du mit zwei Putts oder weniger beendest. Zielquote > 80 %. Realistische Messung deines Längengefühls und Dreiputt-Vermeidungsrate.',
        tags: ['analysis', 'realplay']
    },
    {
        title: 'Spiral-Drill',
        category: 'putting',
        difficulty: 3,
        durationMin: 12,
        description:
            'Markiere einen 60 cm-Kreis ums Loch. 10 Bälle von 1 – 10 m aus verschiedenen Winkeln im Kreis um das Loch herum. Ziel: jeder Ball muss innerhalb 60 cm liegen. Bei Erfolg Radius verringern auf 40 cm. Fördert Distanzkonstanz & Richtungskontrolle.',
        tags: ['distance', 'control', 'feel']
    },
    {
        title: 'Landezonen-Drill – Ziel statt Technik',
        category: 'chipping',
        difficulty: 3,
        durationMin: 12,
        description:
            'Lege drei Handtücher als Landezonen (1 m, 2 m, 3 m hinter Vorgrünkante). Wähle vor jedem Schlag bewusst eine Zone und einen Schläger. Fokus auf Vorstellung & Ausführung, nicht Technik. Ziel: Trefferquote in der gewählten Zone.',
        tags: ['target', 'visualization', 'feel']
    },
    {
        title: 'Commitment-Drill – Entscheidung zählt',
        category: 'chipping',
        difficulty: 4,
        durationMin: 10,
        description:
            'Fünf unterschiedliche Lagen ums Grün. Wähle jeweils den einfachsten Schlag, dem du vertraust, und führe **nur einen Ball** aus. Kein Wiederholungsball. Ziel: Entscheidung durchziehen und Akzeptanz trainieren.',
        tags: ['decision', 'pressure', 'realplay']
    },
    {
        title: 'Lockerheits-Drill – Gefühl statt Technik',
        category: 'chipping',
        difficulty: 2,
        durationMin: 8,
        description:
            '10 Chips mit lockerem Rhythmus, während du ein einfaches Mantra flüsterst („locker rollen“). Fokus auf Schwunggefühl, nicht auf Technik oder Ergebnis. Ziel: Spannung lösen, Bewegung automatisieren.',
        tags: ['feel', 'rhythm']
    },
    {
        title: 'Druckspiel – Mentale Scorecard',
        category: 'chipping',
        difficulty: 4,
        durationMin: 10,
        description:
            '10 Chips aus gleicher Lage. Zähle nur Bälle, die innerhalb 2 m vom Loch liegen. Score = Anzahl guter Chips. Vergleiche wöchentlich. Trainiert Leistung unter Druck und objektive Bewertung.',
        tags: ['pressure', 'accuracy', 'analysis']
    },
    {
        title: 'Chip-Parcours – Up & Down Challenge',
        category: 'chipping',
        difficulty: 5,
        durationMin: 20,
        description:
            '6–9 Spots ums Grün (verschiedene Lagen). Jeweils 1 Ball pro Spot, Chip + 1 Putt. Zähle Score wie auf dem Platz: 1 = Birdie, 2 = Par, 3 = Bogey. Ziel: Par oder besser. Optional mit Timer (30 s/Station).',
        tags: ['realplay', 'pressure', 'fun']
    },
    {
        title: 'Landespiel – Spot the Spot',
        category: 'chipping',
        difficulty: 3,
        durationMin: 12,
        description:
            'Markiere drei Landeflächen (1 m, 2 m, 3 m). Ziel ist nicht das Loch, sondern die Landestelle. Beobachte Rollverhalten und vergleiche Schläger. 1 Punkt = Landung in Zone + Roll < 1 m. Perfekt zur Loft- und Roll-Wahrnehmung.',
        tags: ['target', 'feel', 'control']
    },
    {
        title: 'Rule of 12 Reality Check',
        category: 'chipping',
        difficulty: 4,
        durationMin: 15,
        description:
            'Teste deine Chip-Matrix: 8i, 9i, PW, GW, SW, LW – gleicher Landepunkt, jeweils 5 Bälle. Miss Rollstrecken, trage Werte in deine Matrix ein. Ziel: reale Bestätigung deiner theoretischen Distanzen.',
        tags: ['analysis', 'technique', 'control']
    },
    {
        title: '21-Punkte-Spiel',
        category: 'chipping',
        difficulty: 3,
        durationMin: 10,
        description:
            '3 Zielbereiche um die Fahne (1 m, 2 m, 3 m). 10 Bälle = 30 Punkte möglich (3-2-1-0). Ziel > 21 Punkte. Variation: nur ein Schläger oder pro Runde wechseln. Einfach, motivierend, mit klarer Erfolgsmessung.',
        tags: ['accuracy', 'fun', 'scoring']
    },
    {
        title: 'One Ball Real Play',
        category: 'chipping',
        difficulty: 5,
        durationMin: 20,
        description:
            'Spiele mit nur einem Ball 9 verschiedene Lagen rund ums Grün. Jeder Schlag zählt: Lage lesen, Schläger wählen, Landepunkt visualisieren, 1 Chip + 1 Putt. Ziel: so viele Up & Downs wie möglich. Trainiert Routine & Fokus.',
        tags: ['realplay', 'routine', 'focus']
    },
    {
        title: 'Randomizer – Würfel-Drill',
        category: 'chipping',
        difficulty: 3,
        durationMin: 10,
        description:
            'Erstelle einen Zufallsgenerator: Würfel 1 = Lage (Rough, Hang, kurz, etc.), Würfel 2 = Schläger, Würfel 3 = Zielentfernung. Kombiniere und spiele spontan. Simulation echter Platzbedingungen – Spaßfaktor hoch!',
        tags: ['variation', 'fun', 'creativity']
    },
    {
        title: 'Fairway Finder',
        category: 'driving',
        difficulty: 2,
        durationMin: 12,
        description:
            'Baue dir links und rechts der Ziel-Line je 2–3 imaginäre „Out“-Linien (z. B. 8 m breit). 10 Drives mit bewusst kontrolliertem Rhythmus und 80–85 % Power. Ziel: 8/10 in der „Fairway“-Zone. Fokus auf Balance, Zentrierung am Treffpunkt und Wiederholbarkeit.',
        tags: ['control', 'rhythm']
    },
    {
        title: 'Teehöhe & Startfenster',
        category: 'driving',
        difficulty: 2,
        durationMin: 10,
        description:
            'Teste drei Tee-Höhen (niedrig, mittel, hoch) je 5 Bälle. Beobachte Startwinkel und Treffhöhe (oberes Drittel der Schlagfläche). Wähle danach „deine“ Standardhöhe. Ziel: konstantes Startfenster und Launch.',
        tags: ['technique', 'launch', 'impact']
    },
    {
        title: 'Dispersion Links/Rechts',
        category: 'driving',
        difficulty: 3,
        durationMin: 15,
        description:
            'Markiere eine 20 m breite Zielgasse. Spiele 12 Drives: 6 mit bewusster „Anti-Links“-Intention (z. B. Ball weiter vorne, Face leicht offen), 6 mit „Anti-Rechts“. Notiere, welche Setup-Änderung deine Streuung am besten reduziert.',
        tags: ['strategy', 'analysis']
    },
    {
        title: 'Tempo-Leiter (1–2–3–2–1)',
        category: 'driving',
        difficulty: 3,
        durationMin: 12,
        description:
            'Schlage 5 Sequenzen à 5 Drives: Tempo-Stufen 1 (locker), 2 (normal), 3 (sportlich), 2, 1. Ziel: gleiche Treffqualität auf allen Stufen; überprüfe Ballflug und Balance. Hilft, „zu viel Wollen“ zu glätten.',
        tags: ['rhythm', 'balance', 'control']
    },
    {
        title: 'Shaping Basics – Draw/Fade',
        category: 'driving',
        difficulty: 4,
        durationMin: 15,
        description:
            'Je 6 Drives mit leichtem Draw (Ausrichtung leicht rechts, Face minimal rechts-geschlossen) und leichtem Fade (Ausrichtung leicht links, Face minimal links-offen). Ziel: kleiner, reproduzierbarer Kurvenflug. Fokus: Startlinie zuerst, Kurve zweitrangig.',
        tags: ['shaping', 'control']
    },
    {
        title: 'Speed ohne Chaos',
        category: 'driving',
        difficulty: 4,
        durationMin: 12,
        description:
            '3 Blöcke à 5 Bälle: Block 1 normal, Block 2 „schnell aber sauber“ (nur 5–8 % mehr Tempo), Block 3 wieder normal. Ziel: in Block 2 Ballgeschwindigkeit steigern, ohne Treffqualität zu verlieren. Notiere besten „schnellen“ Schwung, der noch kontrolliert ist.',
        tags: ['speed', 'control', 'efficiency']
    },
    {
        title: 'Kontakt-Gate (Ball/Divot)',
        category: 'irons',
        difficulty: 2,
        durationMin: 12,
        description:
            'Stecke zwei Tees 1 Schlägerkopfbreite vor und hinter den Ball – „Gate“. 15 Schläge mit mittlerem Eisen. Ziel: Ball zuerst, Divot nach dem Ball, ohne die Tees zu treffen. Beobachte Divot-Lage und -Richtung.',
        tags: ['impact', 'technique']
    },
    {
        title: '3/4-Schwung Kontrolle',
        category: 'irons',
        difficulty: 3,
        durationMin: 12,
        description:
            'Spiele mit 3/4-Länge (Gefühl 75 % Schwung) je 5 Bälle mit 9i, 8i, 7i. Ziel: flachere Flugbahn, konstanter Kontakt und enge Längenstreuung. Nutze gleitenden Rhythmus: gleiches Tempo, nur Weg kürzer.',
        tags: ['distance', 'rhythm', 'control']
    },
    {
        title: 'Trajectory Control – Knockdown',
        category: 'irons',
        difficulty: 4,
        durationMin: 15,
        description:
            'Mit 7i/8i 12 Bälle: 6× normal, 6× „knockdown“ (Ball leicht zurück, Griff minimal vor dem Ball, finish kürzer). Ziel: niedrigere Flugbahn und windtauglicher Schlag. Vergleich der Landepunkte und Rollstrecke.',
        tags: ['shaping', 'control']
    },
    {
        title: 'Gapping Mini-Matrix',
        category: 'irons',
        difficulty: 3,
        durationMin: 18,
        description:
            'Wähle 4 Eisen (z. B. PW, 9i, 8i, 7i). Spiele je 6 Bälle und notiere Carry-Schätzung (oder Markierungen). Ziel: durchschnittliche Carry je Schläger ermitteln, Ausreißer streichen. Ergebnis als „Gapping“-Notiz speichern.',
        tags: ['analysis', 'distance']
    },
    {
        title: 'Hanglagen-Quickie',
        category: 'irons',
        difficulty: 4,
        durationMin: 10,
        description:
            '5 Bälle „Ball über Füßen“, 5 Bälle „Ball unter Füßen“. Passe Standbreite, Kniebeuge und Zielausrichtung an (Kurvenflug einkalkulieren). Ziel: solide Kontakte und akzeptable Startlinie trotz Hang.',
        tags: ['variation', 'adjustment']
    },
    {
        title: 'Zielstreifen 10 m',
        category: 'irons',
        difficulty: 3,
        durationMin: 12,
        description:
            'Lege einen 10 m langen, 6–8 m breiten Zielstreifen (im Netz/Range „Fenster“ definieren). 15 Bälle mit mittlerem Eisen. Ziel: 70 % innerhalb des Streifens. Fokus: Ausrichtung, Startlinie, Face-to-Path ruhig halten.',
        tags: ['accuracy', 'line', 'control']
    }
]

const STORAGE_KEY = 'parformance.drills.v1';

export const useDrillStore = defineStore('drills', {
    state: () => ({
        drills: [] as Drill[],
        loaded: false,
    }),
    getters: {
        byCategory: (state) => (category?: DrillCategory) =>
            category ? state.drills.filter(d => d.category === category) : state.drills,
        // New getters per acceptance criteria
        getById: (state) => (id: string) => state.drills.find(d => d.id === id),
        getByCategory: (state) => (cat?: DrillCategory) =>
            cat ? state.drills.filter(d => d.category === cat) : state.drills,
    },
    actions: {
        async load() {
            const stored = await Preferences.get({ key: STORAGE_KEY })
            this.drills = stored.value ? JSON.parse(stored.value) : []

            // nur beim allerersten Start
            if (this.drills.length === 0) {
                this.drills = defaultDrills.map(d => ({
                    ...d,
                    id: crypto.randomUUID(),
                    updatedAt: new Date().toISOString()
                }))
                await this.save()
            }
        },
        async persist() {
            await Preferences.set({key: STORAGE_KEY, value: JSON.stringify(this.drills)});
        },
        async add(drill: Omit<Drill, 'id' | 'updatedAt'>) {
            const newDrill: Drill = {...drill, id: crypto.randomUUID(), updatedAt: new Date().toISOString()};
            this.drills.push(newDrill);
            await this.persist();
            return newDrill;
        },
        async update(drill: Drill) {
            const idx = this.drills.findIndex(d => d.id === drill.id);
            if (idx !== -1) {
                this.drills[idx] = {...drill, updatedAt: new Date().toISOString()};
                await this.persist();
            }
        },
        async remove(id: string) {
            this.drills = this.drills.filter(d => d.id !== id);
            await this.persist();
        },
        random(options?: {
            category?: DrillCategory
            maxDifficulty?: number
            /** mind. 1 der Tags muss vorkommen (ODER) */
            tagsAny?: string[]
            /** alle diese Tags müssen vorkommen (UND) */
            tagsAll?: string[]
            /** rückwärtskompatibel: einzelner Tag */
            tag?: string
        }) {
            let pool = [...this.drills]
            if (options?.category) pool = pool.filter(d => d.category === options.category)
            if (options?.maxDifficulty != null) pool = pool.filter(d => (d.difficulty ?? 3) <= options.maxDifficulty)

            const tagsAny = options?.tagsAny ?? (options?.tag ? [options.tag] : [])
            const tagsAll = options?.tagsAll ?? []

            if (tagsAny.length > 0) {
                pool = pool.filter(d => (d.tags ?? []).some(t => tagsAny.includes(t)))
            }
            if (tagsAll.length > 0) {
                pool = pool.filter(d => tagsAll.every(t => (d.tags ?? []).includes(t)))
            }

            if (pool.length === 0) return undefined
            const i = Math.floor(Math.random() * pool.length)
            return pool[i]
        }

    }
});

// Alias to satisfy API naming: useDrillsStore (plural)
export const useDrillsStore = useDrillStore;
