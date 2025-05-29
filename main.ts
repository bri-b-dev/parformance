import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'

// 1) Definiere deine Übersetzungs-Objekte
const messages = {
    en: {
        title: 'HandyCap',
        intro: 'With HandyCap you can determine your score differential for 9 or 18 holes and manage your handicap. \
        Enter your current handicap (HCPI), adjusted gross score (AGS), the course rating (CR), the slope and the Playing Conditions Calculation (PCC) to calculate your individual score.',
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
        confirm: 'ok',
        cancel: 'cancel',
        inconsistentIndex: 'The given HCPI does not match your calculated - you cannot save the result',
        rights: '© 2025, Brigitte Boehm. All rights reserved.'
    },
    de: {
        title: 'HandyCap',
        intro: 'Mit HandyCap kannst du dein Score Differential für 9 oder 18 Löcher bestimmen und dein Handicap verwalten.\
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
        confirm: 'OK',
        cancel: 'Abbrechen',
        inconsistentIndex: 'Speichern des Ergebnisses nicht möglich - der angegebene HCPI weicht von deinem errechneten ab',
        rights: '© 2025, Brigitte Böhm. Alle Rechte vorbehalten.'
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
