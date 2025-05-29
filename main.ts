import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'

// 1) Definiere deine Übersetzungs-Objekte
const messages = {
    en: {
        title: 'Score Differential Calculator',
        intro: 'With this tool you can determine your Score Differential for 9 or 18 holes.\
        Enter your current handicap (HCPI), adjusted gross score (AGS), course rating (CR), slope and Playing Conditions Calculation (PCC) to get your individual result.',
        choose: 'Choose...',
        holes: 'holes',
        holesPlayed: 'Holes played',
        handicapIndex: 'Handicap-Index (HCPI)',
        forExample: 'e.g.',
        courseRating: 'Course Rating (CR)',
        slope: 'Slope:',
        grossScore: 'Adjusted Gross Score (AGS)',
        pcc: 'Playing Conditions Calculation (PCC)',
        pccNote: 'Note: The PCC adjustment ranges from -1.0 to +3.0 (see Rule 5.6).',
        scoreDifferential: 'Score Differential',
        calculate: 'Calculate',
        note1: 'This calculator serves as a guide and does not replace the official handicap calculation of the association.',
        note2: 'Scored score differentials are used to calculate the handicap index as follows:',
        currentRules: 'Current Handicap-Rules (2024)',
        noOfResults: 'Number of results',
        consideredScoreDifferentials: 'Considered Score Differentials',
        adjustment: 'Adjustment',
        lowest: 'lowest 1',
        lowestAverage: 'average of lowest',
        yourResults: 'Your results',
        date: 'date',
        course: 'course',
        saveResult: 'save result',
        chooseDate: 'choose date',
        currentHandicap: 'Current Handicap',
        delete: 'delete',
        handicapIndexLabel: 'Handicap-Index (HCPI)',
        recalculateHandicap: 'recalculate Handicap',
        handicapIndexShort: 'HCPI',
        scoreDifferentialShort: 'SD',
        grossScoreShort: 'AGS',
        development: 'Development',
    },
    de: {
        title: 'Score Differential Rechner',
        intro: 'Mit diesem Tool kannst du dein Score Differential für 9 oder 18 Löcher bestimmen.\
        Gib dein aktuelles Handicap (HCPI), dein gewertetes Bruttoergebnis (GBE), das Course Rating (CR), den Slope und die Korrektur ein, um dein individuelles Ergebnis zu errechnen.',
        choose: 'Wähle...',
        holes: 'Löcher',
        holesPlayed: 'Gespielte Löcher:',
        handicapIndex: 'Handicap-Index (HCPI):',
        forExample: 'z.B.',
        courseRating: 'Course Rating (CR):',
        slope: 'Slope:',
        grossScore: 'Gewertetes Bruttoergebnis (GBE):',
        pcc: 'Course Rating Korrektur (PCC):',
        pccNote: 'Anmerkung: Die PCC-Anpassung reicht von -1,0 bis +3,0 (siehe Regel 5.6).',
        scoreDifferential: 'Score-Differential',
        calculate: 'Berechnen',
        note1: 'Dieser Rechner dient als Orientierung und ersetzt nicht die offizielle Handicaps-Berechnung des Verbands.',
        note2: 'Gewertete Score Differentials werden wie folgt zur Handicap-Berechnung herangezogen:',
        currentRules: 'Aktuelle Handicap-Regeln (2024)',
        noOfResults: 'Anzahl Ergebnisse',
        consideredScoreDifferentials: 'Zur Berechnung des Handicap-Index gewertete Score Differentials',
        adjustment: 'Anpassung',
        lowest: 'der niedrigste',
        lowestAverage: 'Durchschnitt der niedrigsten',
        yourResults: 'Deine Ergebnisse',
        date: 'Datum',
        course: 'Platz',
        saveResult: 'Ergebnis speichern',
        chooseDate: 'Datum wählen',
        currentHandicap: 'Aktuelles Handicap',
        delete: 'Löschen',
        handicapIndexLabel: 'Handicap-Index (HCPI)',
        recalculateHandicap: 'Handicap neu berechnen',
        handicapIndexShort: 'HCPI',
        scoreDifferentialShort: 'SD',
        grossScoreShort: 'GBE',
        development: 'Entwicklung',
    }
}

// 2) Erzeuge das i18n-Plugin
const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'de',
    messages,
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')
