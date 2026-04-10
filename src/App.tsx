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

function Slider({ label, desc, value, set, min, max, step, dark, fmt }: {
  label: string; desc?: string; value: number; set: (v: number) => void
  min: number; max: number; step: number; dark?: boolean; fmt?: (v: number) => string
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label className={`text-[0.7rem] font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>
          {desc && (
            <div className="group relative flex items-center">
              <span className={`flex h-3.5 w-3.5 cursor-default items-center justify-center rounded-full text-[0.5rem] font-bold ${dark ? 'bg-white/15 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>?</span>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-40 -translate-x-1/2 rounded-lg bg-gray-950 px-2.5 py-1.5 text-[0.6rem] leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {desc}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
              </div>
            </div>
          )}
        </div>
        <span className={`font-mono text-[0.65rem] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className={`h-1 w-full cursor-pointer appearance-none rounded-full ${dark ? 'bg-white/15 accent-white' : 'bg-gray-200 accent-gray-950'}`}
      />
    </div>
  )
}

export default function App() {
  const [open, setOpen] = useState(true)
  const [preset, setPreset] = useState<keyof typeof PRESETS>('Light')
  const [dotSize, setDotSize] = useState(2)
  const [totalSize, setTotalSize] = useState(4)
  const [mode, setMode] = useState<'trail' | 'ripple'>('ripple')
  const [glowColor, setGlowColor] = useState<Color>(SWATCHES[0].rgb)
  const [glowHex, setGlowHex] = useState(SWATCHES[0].hex)
  const [baseColor, setBaseColor] = useState<Color>([0, 0, 0])
  const [baseHex, setBaseHex] = useState('#000000')
  const [fadeOut, setFadeOut] = useState(20)
  const [effectRadius, setEffectRadius] = useState(160)
  const [rippleSpeed, setRippleSpeed] = useState(180)
  const [rippleWidth, setRippleWidth] = useState(60)
  const [activeScale, setActiveScale] = useState(2)
  const [gradientDir, setGradientDir] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [gradientRamp, setGradientRamp] = useState(50)
  const gradientGamma = Math.pow(4, 1 - 2 * (gradientRamp / 100))
  const [dotShape, setDotShape] = useState<'square' | 'circle'>('square')

  const decay = 0.005 + ((100 - fadeOut) / 100) * 0.195
  const rippleLifetime = 0.3 + (fadeOut / 100) * 4.7
  const ringOuter = effectRadius

  const { bg } = PRESETS[preset]
  const isDark = preset === 'Dark'

  const toggleTrack = isDark ? 'bg-white/10' : 'bg-gray-100'
  const toggleActive = isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-gray-950 shadow-sm'
  const toggleInactive = isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
  const divider = isDark ? 'border-white/10' : 'border-black/10'
  const labelCls = isDark ? 'text-gray-400' : 'text-gray-500'
  const swatchRing = isDark ? '0 0 0 2px #ffffff' : '0 0 0 2px #131316'
  const gradBg = isDark ? 'bg-white/10' : 'bg-gray-100'
  const gradBtnActive = isDark ? 'bg-white/20 text-white' : 'bg-gray-950 text-white'
  const gradBtnInactive = isDark ? 'bg-white/8 text-gray-400 hover:bg-white/15' : 'bg-white text-gray-500 hover:bg-gray-50'

  return (
    <div className="fixed inset-0" style={{ background: bg }}>
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
        className={`fixed top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition-all duration-300 hover:shadow-lg ${isDark ? 'border-white/15 bg-white/15 text-white hover:bg-white/25' : 'border-black/10 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-950'}`}
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

      <div className={`dots-panel fixed left-4 top-4 z-50 w-56 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${open ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-3 opacity-0 pointer-events-none'} ${isDark ? 'border-white/10 bg-gray-900/85' : 'border-black/10 bg-white/80'}`}>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={`mb-1 block text-[0.6rem] font-medium uppercase tracking-wide ${labelCls}`}>Mode</label>
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
            <label className={`mb-1 block text-[0.6rem] font-medium uppercase tracking-wide ${labelCls}`}>Type</label>
            <div className={`flex rounded-lg p-0.5 ${toggleTrack}`}>
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((p) => (
                <button key={p} onClick={() => setPreset(p)}
                  className={`flex-1 rounded-md py-1 text-[0.7rem] font-medium capitalize transition-all ${preset === p ? toggleActive : toggleInactive}`}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div className={`my-3 border-t ${divider}`} />

        <Slider dark={isDark} label="Dot Size" value={dotSize} set={setDotSize} min={1} max={8} step={0.5} />
        <Slider dark={isDark} label="Active Size" value={activeScale} set={setActiveScale} min={0} max={8} step={0.25} fmt={(v) => `${(1 + v).toFixed(1)}×`} />
        <Slider dark={isDark} label="Gap Size" value={totalSize} set={setTotalSize} min={3} max={16} step={1} />

        {mode === 'trail' ? (
          <Slider dark={isDark} label="Effect Radius" value={effectRadius} set={setEffectRadius} min={40} max={400} step={10} />
        ) : (
          <>
            <Slider dark={isDark} label="Speed" value={rippleSpeed} set={setRippleSpeed} min={40} max={800} step={10} />
            <Slider dark={isDark} label="Ring Width" value={rippleWidth} set={setRippleWidth} min={5} max={120} step={5} />
          </>
        )}
        <Slider dark={isDark} label="Fade Duration" value={fadeOut} set={setFadeOut} min={0} max={100} step={1} />

        <div className={`my-3 border-t ${divider}`} />

        <div className="mb-3">
          <label className={`mb-1.5 block text-[0.7rem] font-medium ${labelCls}`}>Grid Color</label>
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map(({ label, rgb, hex }) => (
              <button key={label} title={label} onClick={() => { setBaseColor(rgb); setBaseHex(hex) }}
                style={{ background: hex, boxShadow: baseHex === hex ? swatchRing : undefined }}
                className="h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110"
              />
            ))}
          </div>
        </div>

        <div className="mb-0">
          <label className={`mb-1.5 block text-[0.7rem] font-medium ${labelCls}`}>Glow Color</label>
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map(({ label, rgb, hex }) => (
              <button key={label} title={label} onClick={() => { setGlowColor(rgb); setGlowHex(hex) }}
                style={{ background: hex, boxShadow: glowHex === hex ? swatchRing : undefined }}
                className="h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110"
              />
            ))}
          </div>
        </div>

        <div className={`my-3 border-t ${divider}`} />

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
            <Slider dark={isDark} label="Gradient Ramp" value={gradientRamp} set={setGradientRamp} min={0} max={100} step={1} />
          </div>
        </div>
      </div>
    </div>
  )
}
