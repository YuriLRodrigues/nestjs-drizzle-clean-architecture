// Draws the README diagrams (layers and request flow) as SVG, in a light and a dark version.
//   node tooling/diagrams.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets')
mkdirSync(assets, { recursive: true })

const THEMES = {
  dark: {
    bg: '#0D1117',
    border: '#30363D',
    box: '#161B22',
    text: '#E6EDF3',
    muted: '#8C97A7',
    line: '#6E7681',
    blue: '#60A5FA',
    blueFill: '#172554',
    green: '#4ADE80',
    greenFill: '#052E16',
    red: '#FF6B6B',
    redFill: '#450A0A',
    amber: '#FACC15',
    amberFill: '#422006',
  },
  light: {
    bg: '#FFFFFF',
    border: '#D0D7DE',
    box: '#F6F8FA',
    text: '#1F2328',
    muted: '#656D76',
    line: '#8C959F',
    blue: '#1D4ED8',
    blueFill: '#DBEAFE',
    green: '#15803D',
    greenFill: '#DCFCE7',
    red: '#B91C1C',
    redFill: '#FEE2E2',
    amber: '#A16207',
    amberFill: '#FEF9C3',
  },
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,'Cascadia Mono',Consolas,Menlo,monospace"
const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function canvas(width, height, theme, body) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${theme.line}"/></marker></defs>`,
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${theme.bg}" stroke="${theme.border}"/>`,
    ...body,
    '</svg>',
    '',
  ].join('\n')
}

const text = (x, y, value, { fill, size = 13, weight = 400, anchor = 'start', mono = false }) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${mono ? MONO : FONT}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`

const arrow = (theme, points, dashed = false) =>
  `<path d="M${points.map((p) => p.join(' ')).join('L')}" fill="none" stroke="${theme.line}" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 4"' : ''} marker-end="url(#arrow)"/>`

// ── Layers ───────────────────────────────────────────────────────────────────────────────────────────────────

function layers(theme) {
  const card = (x, y, w, h, title, lines, accent, fill) => [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${accent}" stroke-width="1.5"/>`,
    text(x + 18, y + 30, title, { fill: accent, size: 15, weight: 700, mono: true }),
    ...lines.map((line, i) => text(x + 18, y + 54 + i * 20, line, { fill: i === 0 ? theme.text : theme.muted })),
  ]

  return canvas(880, 470, theme, [
    text(28, 38, 'Layers and the dependency rule', { fill: theme.text, size: 17, weight: 700 }),
    text(28, 60, 'Arrows point to what a layer may import. ESLint fails the build on any other import.', {
      fill: theme.muted,
    }),
    ...card(
      28,
      84,
      400,
      112,
      'presentations/http',
      ['The HTTP edge', 'controllers · DTOs · view models · guards', 'error filter · Swagger'],
      theme.blue,
      theme.blueFill,
    ),
    ...card(
      452,
      84,
      400,
      112,
      'infra',
      ['Adapters', 'Drizzle repositories · mappers · migrations', 'bcrypt · JWT · env · event subscribers · logger'],
      theme.amber,
      theme.amberFill,
    ),
    ...card(
      140,
      236,
      600,
      92,
      'domain/<context>',
      ['The business rules', 'entities · value objects · events · policies · use cases · abstract repositories'],
      theme.green,
      theme.greenFill,
    ),
    ...card(
      240,
      368,
      400,
      74,
      'core',
      ['Framework-free building blocks: Entity, Either, DomainError, events'],
      theme.line,
      theme.box,
    ),
    arrow(theme, [
      [228, 196],
      [228, 216],
      [330, 216],
      [330, 234],
    ]),
    arrow(theme, [
      [652, 196],
      [652, 216],
      [550, 216],
      [550, 234],
    ]),
    arrow(theme, [
      [440, 328],
      [440, 366],
    ]),
    text(452, 352, 'imports', { fill: theme.muted, size: 12 }),
    text(660, 224, 'implements the abstract classes', { fill: theme.muted, size: 12 }),
    text(60, 224, 'calls the use cases', { fill: theme.muted, size: 12 }),
  ])
}

// ── Request flow ─────────────────────────────────────────────────────────────────────────────────────────────

function flow(theme) {
  const node = (x, y, w, label, { accent = theme.line, fill = theme.box, sub } = {}) => [
    `<rect x="${x}" y="${y}" width="${w}" height="${sub ? 54 : 38}" rx="8" fill="${fill}" stroke="${accent}" stroke-width="1.5"/>`,
    text(x + w / 2, y + 24, label, { fill: theme.text, size: 13, weight: 600, anchor: 'middle', mono: true }),
    sub ? text(x + w / 2, y + 42, sub, { fill: theme.muted, size: 11, anchor: 'middle' }) : '',
  ]
  const link = (from, to, y) =>
    arrow(theme, [
      [from, y],
      [to - 2, y],
    ])

  return canvas(880, 400, theme, [
    text(28, 38, 'How a request flows', { fill: theme.text, size: 17, weight: 700 }),
    text(28, 60, 'A use case never throws for a business rule: it returns Left(error) or Right(value).', {
      fill: theme.muted,
    }),

    ...node(28, 88, 76, 'HTTP'),
    ...node(126, 88, 110, 'AuthGuard'),
    ...node(258, 88, 116, 'RolesGuard'),
    ...node(396, 88, 176, 'ValidationPipe (DTO)'),
    ...node(594, 88, 116, 'Controller', { accent: theme.blue, fill: theme.blueFill }),
    ...node(732, 88, 120, 'UseCase', { accent: theme.green, fill: theme.greenFill }),
    link(104, 126, 107),
    link(236, 258, 107),
    link(374, 396, 107),
    link(572, 594, 107),
    link(710, 732, 107),

    // Either
    text(792, 158, 'Either', { fill: theme.muted, size: 12, anchor: 'middle' }),
    arrow(theme, [
      [760, 126],
      [760, 176],
      [652, 176],
      [652, 198],
    ]),
    ...node(482, 200, 340, 'Right(value) → ViewModel.toHttp()', {
      accent: theme.green,
      fill: theme.greenFill,
      sub: 'the entity never leaves raw: 200 / 201 with JSON',
    }),
    arrow(theme, [
      [824, 126],
      [824, 270],
      [652, 270],
      [652, 286],
    ]),
    ...node(482, 288, 340, 'Left(DomainError) → HttpErrorFilter', {
      accent: theme.red,
      fill: theme.redFill,
      sub: '{ statusCode, code, message, details? }',
    }),

    // Persistence
    arrow(
      theme,
      [
        [770, 88],
        [770, 72],
        [866, 72],
        [866, 376],
        [14, 376],
        [14, 227],
        [26, 227],
      ],
      true,
    ),
    ...node(28, 200, 180, 'Repository', {
      accent: theme.green,
      fill: theme.greenFill,
      sub: 'abstract class = DI token',
    }),
    ...node(28, 288, 180, 'DrizzleRepository', { accent: theme.amber, fill: theme.amberFill, sub: 'mapper ⇄ row' }),
    ...node(252, 288, 150, 'Postgres'),
    ...node(252, 200, 150, 'DomainEvents', { accent: theme.amber, fill: theme.amberFill, sub: 'after the write' }),
    arrow(theme, [
      [118, 254],
      [118, 286],
    ]),
    link(208, 252, 315),
    arrow(theme, [
      [327, 288],
      [327, 256],
    ]),
    text(440, 366, 'the use case asks for the abstract repository; Nest injects the Drizzle one', {
      fill: theme.muted,
      size: 12,
      anchor: 'middle',
    }),
  ])
}

for (const [name, theme] of Object.entries(THEMES)) {
  writeFileSync(join(assets, `layers-${name}.svg`), layers(theme))
  writeFileSync(join(assets, `request-flow-${name}.svg`), flow(theme))
}
console.log('diagrams written to docs/assets')
