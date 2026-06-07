import { WordPhonemeData, PronunciationIssue } from '../types'

const ARPABET_TO_IPA: Record<string, string> = {
  AA: 'ɑː', AE: 'æ',  AH: 'ə',  AO: 'ɔː', AW: 'aʊ', AY: 'aɪ',
  B:  'b',  CH: 'tʃ', D:  'd',  DH: 'ð',  EH: 'ɛ',  ER: 'ɜːr',
  EY: 'eɪ', F: 'f',  G:  'ɡ',  HH: 'h',  IH: 'ɪ',  IY: 'iː',
  JH: 'dʒ', K: 'k',  L:  'l',  M:  'm',  N:  'n',  NG: 'ŋ',
  OW: 'oʊ', OY: 'ɔɪ', P: 'p',  R:  'r',  S:  's',  SH: 'ʃ',
  T:  't',  TH: 'θ',  UH: 'ʊ',  UW: 'uː', V:  'v',  W:  'w',
  Y:  'j',  Z:  'z',  ZH: 'ʒ',
}

export function arpabetToIpa(arpabet: string): string {
  return arpabet
    .trim()
    .split(/\s+/)
    .map(p => ARPABET_TO_IPA[p.replace(/\d$/, '')] ?? p.toLowerCase())
    .join('')
}

export function extractPronunciationIssues(phonemes: WordPhonemeData[]): PronunciationIssue[] {
  const issues: PronunciationIssue[] = []
  for (const w of phonemes) {
    if (w.accuracyScore >= 82) continue
    const badSylls = w.phonemes.filter(s => s.score < 65 || s.dpResult !== 0)
    if (badSylls.length === 0) continue
    issues.push({
      word: w.word,
      score: Math.round(w.accuracyScore),
      syllables: badSylls.map(s => ({
        ipa: arpabetToIpa(s.symbol),
        score: Math.round(s.score),
        dpResult: s.dpResult,
      })),
    })
  }
  return issues
}
