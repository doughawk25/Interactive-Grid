import { useState } from 'react'
import { Dots } from './Dots'

type Color = [number, number, number]

const PRESETS = {
  'Light': { bg: '#ffffff' },
  'Dark':  { bg: '#0a0a0b' },
}

const SWATCHES: { label: string; rgb: Color; hex: string }[] = [
  { label: 'Purple',  rgb: [108, 71, 255], hex: '#6C47FF' },
  { label: 'Sky',     rgb: [58,  212, 253], hex: '#3AD4FD' },
  { label: 'Green',   rgb: [74,  222, 104], hex: '#4ADE68' },
  { label: 'Orange',  rgb: [249, 140, 73],  hex: '#F98C49' },
  { label: 'Red',     rgb: [248, 113, 113], hex: '#F87171' },
  { label: 'Blue',    rgb: [96,  165, 250], hex: '#60A5FA' },
  { label: 'Yellow',  rgb: [253, 224, 71],  hex: '#FDE047' },
  { label: 'White',   rgb: [255, 255, 255], hex: '#FFFFFF' },
  { label: 'Black',   rgb: [0,   0,   0],   hex: '#000000' },
  { label: 'Gray',    rgb: [147, 148, 161], hex: '#9394A1' },
]

function IconGroup({ track, children }: { track: string; active?: string; inactive?: string; children: React.ReactNode }) {
  return <div className={`flex flex-1 rounded-lg p-0.5 gap-0.5 ${track}`}>{children}</div>
}

function IconButton({ title, selected, active, inactive, onClick, children }: {
  title: string; selected: boolean; active: string; inactive: string
  onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-6 flex-1 items-center justify-center rounded-md transition-all ${selected ? active : inactive}`}
    >
      {children}
    </button>
  )
}

const iconProps = {
  width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}

function TrailIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="3.25" cy="8" r="0.9" fill="currentColor" stroke="none" opacity="0.35" />
      <circle cx="6.25" cy="8" r="1.1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="9.5" cy="8" r="1.35" fill="currentColor" stroke="none" opacity="0.85" />
      <circle cx="13" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function RippleIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="3.8" opacity="0.6" />
      <circle cx="8" cy="8" r="6.2" opacity="0.3" />
    </svg>
  )
}

function SquareIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="10" height="10" rx="1.2" />
    </svg>
  )
}

function CircleIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="5" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="2.8" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13.2 9.6a5.4 5.4 0 0 1-6.8-6.8 5.6 5.6 0 1 0 6.8 6.8Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Slider({ label, desc, value, set, min, max, step, fmt }: {
  label: string; desc?: string; value: number; set: (v: number) => void
  min: number; max: number; step: number; fmt?: (v: number) => string
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label className="text-[0.7rem] font-medium text-foreground-muted">{label}</label>
          {desc && (
            <div className="group relative flex items-center">
              <span className="flex h-3.5 w-3.5 cursor-default items-center justify-center rounded-full bg-foreground/15 text-[0.5rem] font-bold text-foreground-muted">?</span>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-40 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-[0.6rem] leading-snug text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {desc}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              </div>
            </div>
          )}
        </div>
        <span className="font-mono text-[0.65rem] text-foreground-muted/70">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/[0.08] accent-foreground"
      />
    </div>
  )
}

export default function App() {
  const [open, setOpen] = useState(true)
  const [preset, setPreset] = useState<keyof typeof PRESETS>('Light')
  const [dotSize, setDotSize] = useState(2)
  const [totalSize, setTotalSize] = useState(6)
  const [mode, setMode] = useState<'trail' | 'ripple'>('ripple')
  const [glowColor, setGlowColor] = useState<Color>(SWATCHES[0].rgb)
  const [glowHex, setGlowHex] = useState(SWATCHES[0].hex)
  const [baseColor, setBaseColor] = useState<Color>([0, 0, 0])
  const [baseHex, setBaseHex] = useState('#000000')
  const [fadeOut, setFadeOut] = useState(20)
  const [effectRadius, setEffectRadius] = useState(160)
  const [rippleSpeed, setRippleSpeed] = useState(180)
  const [rippleWidth, setRippleWidth] = useState(60)
  const [activeScale, setActiveScale] = useState(1)
  const [gradientDir, setGradientDir] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [gradientRamp, setGradientRamp] = useState(50)
  const gradientGamma = Math.pow(4, 1 - 2 * (gradientRamp / 100))
  const [dotShape, setDotShape] = useState<'square' | 'circle'>('square')

  const decay = 0.005 + ((100 - fadeOut) / 100) * 0.195
  const rippleLifetime = 0.3 + (fadeOut / 100) * 4.7
  const ringOuter = effectRadius

  const { bg } = PRESETS[preset]
  const isDark = preset === 'Dark'

  const toggleTrack = 'bg-foreground/[0.06]'
  const toggleActive = 'bg-raised text-foreground shadow-sm'
  const toggleInactive = 'text-foreground-muted hover:text-foreground'
  const divider = 'border-foreground/10'
  const labelCls = 'text-foreground-muted'
  const swatchRing = '0 0 0 2px rgb(var(--color-foreground))'
  const gradBg = 'bg-foreground/8'
  const gradBtnActive = 'bg-foreground text-background'
  const gradBtnInactive = 'bg-raised text-foreground-muted hover:bg-surface'

  return (
    <div className={`fixed inset-0 ${isDark ? 'dark' : ''}`} style={{ background: bg }}>
      <Dots
        colors={[baseColor]}
        dotSize={dotSize}
        totalSize={totalSize}
        mode={mode}
        glowColor={glowColor}
        mouseRingInner={0}
        mouseRingOuter={ringOuter}
        mouseDecay={decay}
        rippleSpeed={rippleSpeed}
        rippleWidth={rippleWidth}
        rippleLifetime={rippleLifetime}
        gradientDir={gradientDir}
        gradientGamma={gradientGamma}
        dotShape={dotShape}
        activeScale={activeScale}
      />

      <button
        onClick={() => setOpen((o) => !o)}
        style={{ left: open ? '15.5rem' : '1rem' }}
        className="fixed top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10 bg-raised text-foreground-muted shadow-md transition-all duration-300 hover:bg-surface hover:text-foreground hover:shadow-lg"
        aria-label={open ? 'Hide controls' : 'Show controls'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12"
          className="transition-transform duration-300 ease-in-out"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        >
          <line x1="6" y1="1" x2="6" y2="11" />
          <line x1="1" y1="6" x2="11" y2="6" />
        </svg>
      </button>

      <div className={`dots-panel fixed left-4 top-4 z-50 w-56 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-foreground/10 bg-raised/85 p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${open ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-3 opacity-0 pointer-events-none'}`}>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={`mb-1 block text-[0.6rem] font-medium uppercase tracking-wide ${labelCls}`}>Type</label>
            <div className={`flex rounded-lg p-0.5 ${toggleTrack}`}>
              {(['trail', 'ripple'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 rounded-md py-1 text-[0.7rem] font-medium capitalize transition-all ${mode === m ? toggleActive : toggleInactive}`}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className={`mb-1 block text-[0.6rem] font-medium uppercase tracking-wide ${labelCls}`}>Shape</label>
            <div className={`flex rounded-lg p-0.5 ${toggleTrack}`}>
              {(['square', 'circle'] as const).map((s) => (
                <button key={s} onClick={() => setDotShape(s)}
                  className={`flex-1 rounded-md py-1 text-[0.7rem] font-medium capitalize transition-all ${dotShape === s ? toggleActive : toggleInactive}`}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <label className={`mb-1 block text-[0.6rem] font-medium uppercase tracking-wide ${labelCls}`}>Mode</label>
            <div className={`flex rounded-lg p-0.5 ${toggleTrack}`}>
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((p) => (
                <button key={p} onClick={() => setPreset(p)}
                  className={`flex-1 rounded-md py-1 text-[0.7rem] font-medium capitalize transition-all ${preset === p ? toggleActive : toggleInactive}`}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="my-3 h-px bg-foreground/[0.04]" style={{ boxShadow: 'inset 0 0.5px 0 0 rgb(var(--color-foreground) / 0.08)' }} />

        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map(({ label, rgb, hex }) => (
              <button key={label} title={label} onClick={() => { setBaseColor(rgb); setBaseHex(hex) }}
                style={{ background: hex, boxShadow: baseHex === hex ? swatchRing : undefined }}
                className="h-5 w-5 rounded-full border border-foreground/10 transition-transform hover:scale-110"
              />
            ))}
          </div>
        </div>

        <div className="mb-0">
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map(({ label, rgb, hex }) => (
              <button key={label} title={label} onClick={() => { setGlowColor(rgb); setGlowHex(hex) }}
                style={{ background: hex, boxShadow: glowHex === hex ? swatchRing : undefined }}
                className="h-5 w-5 rounded-full border border-foreground/10 transition-transform hover:scale-110"
              />
            ))}
          </div>
        </div>

        <div className="my-3 h-px bg-foreground/[0.04]" style={{ boxShadow: 'inset 0 0.5px 0 0 rgb(var(--color-foreground) / 0.08)' }} />

        <Slider label="Dot Size" value={dotSize} set={setDotSize} min={1} max={8} step={0.5} />
        <Slider label="Active Size" value={activeScale} set={setActiveScale} min={0} max={8} step={0.25} fmt={(v) => `${(1 + v).toFixed(1)}×`} />
        <Slider label="Gap Size" value={totalSize} set={setTotalSize} min={3} max={16} step={1} />

        {mode === 'trail' ? (
          <Slider label="Effect Radius" value={effectRadius} set={setEffectRadius} min={40} max={400} step={10} />
        ) : (
          <>
            <Slider label="Speed" value={rippleSpeed} set={setRippleSpeed} min={40} max={800} step={10} />
            <Slider label="Ring Width" value={rippleWidth} set={setRippleWidth} min={5} max={120} step={5} />
          </>
        )}
        <Slider label="Fade Duration" value={fadeOut} set={setFadeOut} min={0} max={100} step={1} />

        <div className="my-3 h-px bg-foreground/[0.04]" style={{ boxShadow: 'inset 0 0.5px 0 0 rgb(var(--color-foreground) / 0.08)' }} />

        <div>
          <label className={`mb-2 block text-[0.7rem] font-medium ${labelCls}`}>Gradient Direction</label>
          <div className={`flex justify-center rounded-xl p-2 ${gradBg}`}>
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button onClick={() => setGradientDir(gradientDir === 3 ? 0 : 3)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${gradientDir === 3 ? gradBtnActive : gradBtnInactive}`}>↓</button>
              <div />
              <button onClick={() => setGradientDir(gradientDir === 2 ? 0 : 2)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${gradientDir === 2 ? gradBtnActive : gradBtnInactive}`}>←</button>
              <button onClick={() => setGradientDir(0)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors ${gradientDir === 0 ? gradBtnActive : gradBtnInactive}`}>●</button>
              <button onClick={() => setGradientDir(gradientDir === 1 ? 0 : 1)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${gradientDir === 1 ? gradBtnActive : gradBtnInactive}`}>→</button>
              <div />
              <button onClick={() => setGradientDir(gradientDir === 4 ? 0 : 4)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${gradientDir === 4 ? gradBtnActive : gradBtnInactive}`}>↑</button>
              <div />
            </div>
          </div>
          <div className="mt-2">
            <Slider label="Gradient Ramp" value={gradientRamp} set={setGradientRamp} min={0} max={100} step={1} />
          </div>
        </div>
      </div>
    </div>
  )
}
