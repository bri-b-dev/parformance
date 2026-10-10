/**
 * pdfParser.ts
 *
 * Parses a DGV Scoring Record (Detailliert) PDF and extracts round data.
 * Uses pdfjs-dist for in-browser PDF text extraction.
 *
 * Use the "Scoring Record (Detailliert)" from your club's handicap portal,
 * NOT the "Handicap History Sheet". The Scoring Record contains the official
 * SD values already computed by the handicap server, so no recalculation is needed.
 */

import * as pdfjsLib from 'pdfjs-dist'

// Point the worker at the bundled worker file shipped with pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export interface ImportedRound {
  date: string       // ISO date: YYYY-MM-DD
  courseName: string // "<Club> - <Tournament>"
  holes: number      // 9 or 18
  cr: number         // Course Rating
  slope: number      // Slope
  hcpi: number       // HCPI at time of round
  gbe: number        // Gewertetes Bruttoergebnis (Adjusted Gross Score)
  sd: number         // Score Differential (official value from the PDF)
  tee?: string       // from the "Tees:" line, if recognised
  par?: number       // from the "Par:" value, if recognised
}

/**
 * Converts a German date string "DD.MM.YYYY" to ISO "YYYY-MM-DD".
 */
function parseGermanDate(raw: string): string {
  const [d, m, y] = raw.split('.')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/**
 * Extracts all text from a PDF File object.
 */
async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  return text
}

/**
 * Parses text extracted from a DGV Scoring Record (Detailliert).
 *
 * After text extraction and whitespace normalisation, each entry looks like:
 *   "DD.MM.YYYY <ClubNr> <TournamentName> <Holes> <Type> <GBE> <SD>
 *    Club: <ClubName> Country: ... Rd.: ... PCC: ...
 *    Tees: ... Par: ... CR: <cr> Slope: <slope> HCPI: <hcpi> CH: ... ExSc: ..."
 *
 * The SD value is taken directly from the PDF (official handicap-server value).
 */
function parseRounds(text: string): ImportedRound[] {
  const rounds: ImportedRound[] = []

  // Normalise whitespace
  const normalised = text.replaceAll(/\s+/g, ' ')

  // Split on date boundaries
  const segments = normalised.split(/(?=\d{2}\.\d{2}\.\d{4})/)

  // Main row: date  clubNr  tournamentName  holes  type  GBE  SD  Club:
  // The lazy (.*?) captures the tournament name without greedily eating holes/GBE/SD.
  const mainRowRe = /^(\d{2}\.\d{2}\.\d{4})\s+\d+\s+(.*?)\s+(9|18)\s+[A-Z]\s+(\d+)\s+([\d.]+)\s+Club:/

  // Club name between "Club:" and "Country:"
  const clubRe = /Club:\s*(.*?)\s+Country:/

  // CR, Slope, HCPI from the Tees line
  // Optional: tee name and par ("Tees: <tee> Par: <par> CR: ...")
  const teeParRe = /Tees:\s*(.*?)\s+Par:\s*(\d+)\s+CR:/

  const detailRe = /CR:\s*([\d,.]+)\s+Slope:\s*(\d+).*?HCPI:\s*([\d,]+)/

  for (const seg of segments) {
    const mainMatch = mainRowRe.exec(seg)
    if (!mainMatch) continue

    const [, rawDate, tournament, rawHoles, rawGBE, rawSD] = mainMatch

    const clubMatch = clubRe.exec(seg)
    const club = clubMatch ? clubMatch[1].trim() : ''

    const detailMatch = detailRe.exec(seg)
    if (!detailMatch) continue

    const [, rawCR, rawSlope, rawHCPI] = detailMatch

    const teeMatch = teeParRe.exec(seg)
    const tee = teeMatch?.[1]?.trim() || undefined
    const par = teeMatch ? Number.parseInt(teeMatch[2], 10) : undefined

    const holes = Number.parseInt(rawHoles, 10)
    const gbe = Number.parseInt(rawGBE, 10)
    const sd = Number.parseFloat(rawSD)
    const cr = Number.parseFloat(rawCR.replace(',', '.'))
    const slope = Number.parseInt(rawSlope, 10)
    const hcpi = Number.parseFloat(rawHCPI.replace(',', '.'))

    if (Number.isNaN(cr) || Number.isNaN(slope) || Number.isNaN(gbe) || Number.isNaN(holes) || Number.isNaN(sd)) continue

    const courseName = club && tournament
      ? `${club} - ${tournament}`
      : tournament || club

    rounds.push({
      date: parseGermanDate(rawDate),
      courseName: courseName.trim(),
      holes,
      cr,
      slope,
      hcpi,
      gbe,
      sd,
      tee,
      par
    })
  }

  return rounds
}


/**
 * Main entry point: parse a DGV Scoring Record PDF and return ImportedRound[].
 */
export async function parsePdf(file: File): Promise<ImportedRound[]> {
  const text = await extractText(file)
  return parseRounds(text)
}

/**
 * Returns the official SD value from the imported round.
 * The SD is read directly from the Scoring Record PDF and not recalculated.
 */
export function computeScoreDifferential(round: ImportedRound): number {
  return round.sd
}
