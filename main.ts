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
        rights: '© 2025, Brigitte Boehm. All rights reserved.',
        confirmDeleteTitle: 'Delete result',
        confirmDeleteMessage: 'Are you sure, you want to delete this result?',
        aboutScoreDifferentials: 'About Score Differentials',
        sdVsHcpiTitle: 'Score-Differential vs. Handicap-Index',
        sdVsHcpiText: '<b>Score Differential</b><br/>\
This is a normed value, that calculates your played round (gross score) with the difficulty of the course (Course Rating and Slope). It shows how good you played compared to a "scratch"-golfer (handicap 0). Lower differentials mean good round.<br/><br/>\
<b>Handicap Index</b><br/>\
This is your personal index, i.e. a number representing your personal level. It results from a selection of your best Score Differentials - according to the number of played rounds the lowest 1-8 differentials are considered and adjusted by a small factor.<br/><br/>\
<b>How they relate</b><br/>\
First you calculate the Score Differential for each round.<br/>\
You collect the last 20 differentials (or less in case you have not played as many rounds yet).<br/>\
Calculate the mean of the lowest values and adjust according to USGA-rules – that results in your Handicap Index.<br/><br/>\
In short: the Score Differential is the "raw value" per round, the Handicap Index the "profile" of your best rounds.',
        courseRatingTitle: 'What\'s the Course Rating (CR)',
        courseRatingText: '',
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
        rights: '© 2025, Brigitte Böhm. Alle Rechte vorbehalten.',
        confirmDeleteTitle: 'Ergebnis löschen',
        confirmDeleteMessage: 'Bist du dir sicher, dass du dieses Ergebnis löschen möchtest?',
        aboutScoreDifferentials: 'Über Score Differentials',
        sdVsHcpiTitle: 'Score-Differential vs. Handicap-Index',
        sdVsHcpiText: '<b>Score Differential</b><br/>\
Das ist ein normierter Wert, der deine tatsächliche Runde (Brutto­score) mit dem Schwierigkeits­level des Platzes (Course Rating und Slope) verrechnet. Er zeigt, wie gut du im Verhältnis zu einem „Scratch“-Golfer (Handicap 0) gespielt hast. Niedrigere Differentials heißen: gute Runde.<br/><br/>\
<b>Handicap Index</b><br/>\
Das ist dein Persönlichkeits­index, also eine Zahl, die dein langfristiges Spielniveau widerspiegelt. Er ergibt sich aus einer Auswahl deiner besten Score Differentials – je nach Anzahl der erspielten Runden werden die niedrigsten 1–8 Differentials gemittelt und um einen kleinen Korrekturfaktor verschoben.<br/><br/>\
<b>Wie sie zusammenhängen</b><br/>\
Für jede Runde berechnest du erst das Score Differential.<br/>\
Du sammelst deine letzten 20 Differentials (oder weniger, wenn du noch nicht so viele Runden gespielt hast).<br/>\
Aus diesen Werten wählst du die besten (niedrigsten) aus, mittlest sie und wendest den USGA-Korrektur­faktor an – das ergibt deinen Handicap Index.<br/><br/>\
Kurz: Das Score Differential ist der „Rohwert“ pro Runde, der Handicap Index das „Profil“ aus deinen besten Runden.',
        courseRatingTitle: 'Was ist das Course Rating (CR)?',
        courseRatingText: 'Das Course Rating (Platzbewertung) ist eine Zahl, die angibt, wie viele Schläge ein „Scratch“-Golfer (Handicap 0) auf einem bestimmten Golfplatz voraussichtlich benötigt. Es wird von offiziellen Platzbewertern ermittelt und berücksichtigt Layout, Länge, Hindernisse sowie gesamte Schwierigkeit des Platzes unter normalen Wetterbedingungen. Ein höheres Course Rating bedeutet, dass der Platz schwieriger für einen sehr guten Spieler ist.<br/><br/>\
<b>Wozu dient das Course Rating?</b><br/>\
Es wird in die Berechnung des Score Differentials einbezogen, um deinen Brutto-Score (die tatsächlich gespielten Schläge) in Relation zur Platz­schwierigkeit zu setzen.<br/>\
Gemeinsam mit dem Slope-Wert sorgt es dafür, dass Runden auf unterschiedlichen Plätzen vergleichbar werden.<br/><br/>\
<b>Beispiel (grob vereinfacht):</b><br/>\
Course Rating 72,0 heißt: Ein Scratch-Spieler braucht an diesem Platz in der Regel 72 Schläge.<br/>\
Wenn du als Hobbyspieler 85 Schläge spielst, fließt der Unterschied (85 – 72,0) in das Score Differential ein.<br/><br/>\
Kurz: Das Course Rating misst, wie schwer ein Platz für einen perfekten Spieler ist, und sorgt so dafür, dass deine Rundenwerte fair gewichtet und in deinem Handicap berücksichtigt werden. Ende.'
    },
}

// 2) Erzeuge das i18n-Plugin
const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'de',
    messages,
    warnHtmlMessage: false
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')
