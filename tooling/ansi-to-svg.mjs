// Turns terminal output (text with ANSI color codes) into an SVG "terminal window", for the README images.
// Every run of text is pinned to the character grid (`x` + `textLength`), so block letters line up in any font.

const CHAR_WIDTH = 8.4
const LINE_HEIGHT = 17
const FONT_SIZE = 14
const PADDING_X = 18
const TITLE_BAR = 34
const PADDING_BOTTOM = 16

const THEMES = {
  dark: { window: '#0D1117', bar: '#161B22', border: '#30363D', text: '#D5DAE1', title: '#8C97A7' },
  light: { window: '#FFFFFF', bar: '#F3F4F6', border: '#D0D7DE', text: '#1F2937', title: '#6B7280' },
}

const BASIC = [
  '#000000',
  '#CD3131',
  '#0DBC79',
  '#E5E510',
  '#2472C8',
  '#BC3FBC',
  '#11A8CD',
  '#E5E5E5',
  '#666666',
  '#F14C4C',
  '#23D18B',
  '#F5F543',
  '#3B8EEA',
  '#D670D6',
  '#29B8DB',
  '#FFFFFF',
]

const hex = (r, g, b) => `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, '0')).join('')}`

function color256(index) {
  if (index < 16) return BASIC[index]
  if (index >= 232) {
    const gray = 8 + (index - 232) * 10
    return hex(gray, gray, gray)
  }
  const cube = index - 16
  const level = (n) => (n === 0 ? 0 : 55 + n * 40)
  return hex(level(Math.floor(cube / 36)), level(Math.floor(cube / 6) % 6), level(cube % 6))
}

/** Splits one line into runs of `{ text, fg, bg, bold, dim }`. */
function parseLine(line) {
  const runs = []
  let style = {}
  // eslint-disable-next-line no-control-regex
  const pattern = /\x1b\[([0-9;]*)m/g
  let last = 0
  let match
  const push = (text) => text && runs.push({ text, ...style })

  while ((match = pattern.exec(line))) {
    push(line.slice(last, match.index))
    last = pattern.lastIndex
    const codes = match[1].split(';').filter(Boolean).map(Number)
    if (codes.length === 0) style = {}
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]
      if (code === 0) style = {}
      else if (code === 1) style = { ...style, bold: true }
      else if (code === 2) style = { ...style, dim: true }
      else if (code === 38 || code === 48) {
        const key = code === 38 ? 'fg' : 'bg'
        if (codes[i + 1] === 2) {
          style = { ...style, [key]: hex(codes[i + 2], codes[i + 3], codes[i + 4]) }
          i += 4
        } else if (codes[i + 1] === 5) {
          style = { ...style, [key]: color256(codes[i + 2]) }
          i += 2
        }
      } else if (code >= 30 && code <= 37) style = { ...style, fg: BASIC[code - 30] }
      else if (code >= 90 && code <= 97) style = { ...style, fg: BASIC[code - 90 + 8] }
      else if (code >= 40 && code <= 47) style = { ...style, bg: BASIC[code - 40] }
    }
  }
  push(line.slice(last))
  return runs
}

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * @param {string[]} lines terminal lines, with ANSI color codes
 * @param {{ theme: 'dark' | 'light', title?: string, minColumns?: number }} options
 */
export function ansiToSvg(lines, { theme, title = '', minColumns = 80 }) {
  const colors = THEMES[theme]
  const parsed = lines.map(parseLine)
  const columns = Math.max(minColumns, ...parsed.map((runs) => runs.reduce((n, run) => n + [...run.text].length, 0)))
  const width = Math.ceil(PADDING_X * 2 + columns * CHAR_WIDTH)
  const height = TITLE_BAR + 14 + lines.length * LINE_HEIGHT + PADDING_BOTTOM

  const body = []
  parsed.forEach((runs, row) => {
    const baseline = TITLE_BAR + 14 + row * LINE_HEIGHT + FONT_SIZE - 2
    let column = 0
    for (const run of runs) {
      const length = [...run.text].length
      const x = PADDING_X + column * CHAR_WIDTH
      column += length
      if (run.bg) {
        body.push(
          `<rect x="${x.toFixed(1)}" y="${baseline - FONT_SIZE + 1}" width="${(length * CHAR_WIDTH).toFixed(1)}" height="${LINE_HEIGHT}" rx="3" fill="${run.bg}"/>`,
        )
      }
      if (!run.text.trim()) continue
      if (/^[█▀▄ ]+$/.test(run.text)) {
        // Blocks are drawn as rectangles: as text, most fonts leave hairlines between the cells.
        const top = TITLE_BAR + 14 + row * LINE_HEIGHT
        const half = LINE_HEIGHT / 2
        ;[...run.text].forEach((char, index) => {
          if (char === ' ') return
          const y = char === '▄' ? top + half : top
          const h = char === '█' ? LINE_HEIGHT : half
          body.push(
            `<rect x="${(x + index * CHAR_WIDTH).toFixed(1)}" y="${y.toFixed(1)}" width="${(CHAR_WIDTH + 0.3).toFixed(1)}" height="${(h + 0.3).toFixed(1)}" fill="${run.fg ?? colors.text}"/>`,
          )
        })
        continue
      }
      // Leading spaces move `x` instead of being drawn: SVG text collapses them.
      const lead = run.text.length - run.text.trimStart().length
      const text = run.text.trim()
      const attrs = [
        `x="${(x + lead * CHAR_WIDTH).toFixed(1)}"`,
        `y="${baseline}"`,
        `textLength="${([...text].length * CHAR_WIDTH).toFixed(1)}"`,
        'lengthAdjust="spacingAndGlyphs"',
        `fill="${run.fg ?? colors.text}"`,
      ]
      if (run.bold) attrs.push('font-weight="700"')
      if (run.dim) attrs.push('opacity="0.6"')
      body.push(`<text ${attrs.join(' ')}>${escapeXml(text)}</text>`)
    }
  })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
    `<style>text{font-family:'Cascadia Mono','Cascadia Code','JetBrains Mono',Consolas,Menlo,'DejaVu Sans Mono',monospace;font-size:${FONT_SIZE}px;white-space:pre}</style>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${colors.window}" stroke="${colors.border}"/>`,
    `<path d="M1 ${TITLE_BAR}V11a10 10 0 0 1 10-10h${width - 22}a10 10 0 0 1 10 10v${TITLE_BAR - 11}z" fill="${colors.bar}"/>`,
    `<circle cx="20" cy="17" r="6" fill="#FF5F57"/><circle cx="40" cy="17" r="6" fill="#FEBC2E"/><circle cx="60" cy="17" r="6" fill="#28C840"/>`,
    title
      ? `<text x="${width / 2}" y="22" text-anchor="middle" fill="${colors.title}" style="font-size:12px">${escapeXml(title)}</text>`
      : '',
    ...body,
    '</svg>',
    '',
  ].join('\n')
}
