import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const vertexShaderSource = `#version 300 es
precision mediump float;
in vec2 coordinates;

uniform vec2 u_resolution;

out vec2 fragCoord;

void main(void) {
  gl_Position = vec4(coordinates, 0.0, 1.0);
  fragCoord = (coordinates + 1.0) * 0.5 * u_resolution;
  fragCoord.y = u_resolution.y - fragCoord.y;
}
`

type Uniform =
  | { type: 'uniform1f'; value: number }
  | { type: 'uniform3f'; value: [number, number, number] }
  | { type: 'uniform1fv'; value: Array<number> }
  | { type: 'uniform3fv'; value: Array<[number, number, number]> }
  | { type: 'uniform1i'; value: number }

export type Uniforms = Record<string, Uniform>

type TextureUnit = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31

interface ShaderProps {
  source: string
  uniforms?: Uniforms
  maxFps?: number
  textures?: Array<string>
  initialState?: 'playing' | 'paused'
  onRender?: (time: number) => void
  mouseDecay?: number
  minStampInterval?: number
  useVelocityAmplitude?: boolean
}

function loadImageAndCreateTextureInfo(
  gl: WebGL2RenderingContext | null,
  shaderProgram: WebGLProgram | null,
  url: string,
  number: TextureUnit,
) {
  return new Promise<{ width: number; height: number; texture: WebGLTexture; location: WebGLUniformLocation | null }>((resolve, reject) => {
    if (!gl || !shaderProgram) return reject()
    let tex = gl.createTexture()
    if (!tex) return reject()
    gl.activeTexture(gl[`TEXTURE${number}`])
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    let textureInfo = { width: 1, height: 1, texture: tex, location: gl.getUniformLocation(shaderProgram, `u_texture_${number}`) }
    let img = new Image()
    img.addEventListener('load', () => {
      if (!gl) return reject()
      textureInfo.width = img.width
      textureInfo.height = img.height
      gl.activeTexture(gl[`TEXTURE${number}`])
      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      resolve(textureInfo)
    })
    img.src = url
  })
}

export interface ShaderHandle {
  play: () => void
  pause: () => void
  fireEvent: () => number
}

export const Shader = forwardRef(function Shader(
  {
    source: fragmentShaderSource,
    uniforms = {},
    textures = [],
    maxFps = Infinity,
    initialState = 'playing',
    onRender,
    mouseDecay = 0.035,
    minStampInterval = 0,
    useVelocityAmplitude = false,
  }: ShaderProps,
  ref: React.ForwardedRef<ShaderHandle>,
) {
  let canvasRef = useRef<HTMLCanvasElement>(null!)
  let state = useRef(initialState)
  let currentTime = useRef(0)
  let eventTime = useRef(0)
  let uniformsRef = useRef(uniforms)
  let mouseDecayRef = useRef(mouseDecay)
  let minStampIntervalRef = useRef(minStampInterval)
  let useVelocityAmplitudeRef = useRef(useVelocityAmplitude)

  useEffect(() => { uniformsRef.current = uniforms }, [uniforms])
  useEffect(() => { mouseDecayRef.current = mouseDecay }, [mouseDecay])
  useEffect(() => { minStampIntervalRef.current = minStampInterval }, [minStampInterval])
  useEffect(() => { useVelocityAmplitudeRef.current = useVelocityAmplitude }, [useVelocityAmplitude])

  useImperativeHandle(ref, () => ({
    play() { state.current = 'playing' },
    pause() { state.current = 'paused' },
    fireEvent() { eventTime.current = currentTime.current; return eventTime.current },
  }), [])

  useEffect(() => {
    let canvas = canvasRef.current
    let offscreenCanvas = document.createElement('canvas')
    let scale = Math.round(Math.max(1, Math.min(window.devicePixelRatio ?? 1, 2)))

    canvas.width = offscreenCanvas.width = canvas.offsetWidth * scale
    canvas.height = offscreenCanvas.height = canvas.offsetHeight * scale

    let raf: number
    let gl = offscreenCanvas.getContext('webgl2')
    let ctx = canvas.getContext('2d')

    if (!gl || !ctx) { gl = null; return }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) { gl = null; return }

    const shaderProgram = createProgram(gl, vertexShader, fragmentShader)
    if (!shaderProgram) { gl = null; return }

    gl.useProgram(shaderProgram)

    let vertexBuffer = gl.createBuffer()
    let vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    let coord = gl.getAttribLocation(shaderProgram, 'coordinates')
    gl.enableVertexAttribArray(coord)
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0)

    let resolutionLoc = gl.getUniformLocation(shaderProgram, 'u_resolution')
    let timeLoc = gl.getUniformLocation(shaderProgram, 'u_time')
    let scrollLoc = gl.getUniformLocation(shaderProgram, 'u_scroll')
    let eventTimeLoc = gl.getUniformLocation(shaderProgram, 'u_event_time')
    let customLocs = new Map<string, WebGLUniformLocation | null>()

    const MAX_TRAIL = 150
    let trailPositions = new Float32Array(MAX_TRAIL * 2).fill(-1)
    let trailStrengths = new Float32Array(MAX_TRAIL).fill(0)
    let trailTimes = new Float32Array(MAX_TRAIL).fill(-1)
    let lastStampX = -1, lastStampY = -1, lastStampTime = -1
    let prevMouseX = -1, prevMouseY = -1, prevMouseTime = -1

    let trailPositionsLoc = gl.getUniformLocation(shaderProgram, 'u_trail_positions')
    let trailStrengthsLoc = gl.getUniformLocation(shaderProgram, 'u_trail_strengths')
    let trailTimesLoc = gl.getUniformLocation(shaderProgram, 'u_trail_times')

    function addStamp(x: number, y: number, amplitude = 1.0) {
      const dx = x - lastStampX, dy = y - lastStampY
      if (lastStampX >= 0 && Math.sqrt(dx * dx + dy * dy) < 4) return
      const minInterval = minStampIntervalRef.current
      if (minInterval > 0 && lastStampTime >= 0 && currentTime.current - lastStampTime < minInterval) return
      trailPositions.copyWithin(0, 2); trailStrengths.copyWithin(0, 1); trailTimes.copyWithin(0, 1)
      trailPositions[(MAX_TRAIL - 1) * 2] = x
      trailPositions[(MAX_TRAIL - 1) * 2 + 1] = y
      trailStrengths[MAX_TRAIL - 1] = amplitude
      trailTimes[MAX_TRAIL - 1] = currentTime.current
      lastStampX = x; lastStampY = y; lastStampTime = currentTime.current
    }

    let mouseOver = false
    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const now = currentTime.current
      if (useVelocityAmplitudeRef.current) {
        let amplitude = 0
        if (prevMouseX >= 0 && now > prevMouseTime) {
          const dx = x - prevMouseX, dy = y - prevMouseY
          amplitude = Math.min(Math.sqrt(dx * dx + dy * dy) / (now - prevMouseTime) / 400, 1.0)
        }
        prevMouseX = x; prevMouseY = y; prevMouseTime = now
        mouseOver = true
        if (amplitude >= 0.05) addStamp(x, y, amplitude)
      } else {
        addStamp(x, y, 1.0)
        mouseOver = true
      }
    }
    function onMouseLeave() {
      mouseOver = false
      lastStampX = -1; lastStampY = -1; lastStampTime = -1
      prevMouseX = -1; prevMouseY = -1; prevMouseTime = -1
    }
    function onMouseClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      trailPositions.copyWithin(0, 2); trailStrengths.copyWithin(0, 1); trailTimes.copyWithin(0, 1)
      trailPositions[(MAX_TRAIL - 1) * 2] = x; trailPositions[(MAX_TRAIL - 1) * 2 + 1] = y
      trailStrengths[MAX_TRAIL - 1] = 1.0; trailTimes[MAX_TRAIL - 1] = currentTime.current
      lastStampX = x; lastStampY = y; lastStampTime = currentTime.current
    }

    function emitTouchPoint(touch: Touch) {
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left, y = touch.clientY - rect.top
      const now = currentTime.current
      if (useVelocityAmplitudeRef.current) {
        let amplitude = 1.0
        if (prevMouseX >= 0 && now > prevMouseTime) {
          const dx = x - prevMouseX, dy = y - prevMouseY
          amplitude = Math.min(Math.sqrt(dx * dx + dy * dy) / (now - prevMouseTime) / 400, 1.0)
          if (amplitude < 0.05) amplitude = 1.0
        }
        prevMouseX = x; prevMouseY = y; prevMouseTime = now
        mouseOver = true
        addStamp(x, y, amplitude)
      } else {
        addStamp(x, y, 1.0)
        mouseOver = true
      }
    }
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 0) return
      e.preventDefault()
      // Reset velocity tracking on a fresh contact
      prevMouseX = -1; prevMouseY = -1; prevMouseTime = -1
      const t = e.touches[0]
      // Always emit a stamp on tap, regardless of mode
      const rect = canvas.getBoundingClientRect()
      const x = t.clientX - rect.left, y = t.clientY - rect.top
      trailPositions.copyWithin(0, 2); trailStrengths.copyWithin(0, 1); trailTimes.copyWithin(0, 1)
      trailPositions[(MAX_TRAIL - 1) * 2] = x; trailPositions[(MAX_TRAIL - 1) * 2 + 1] = y
      trailStrengths[MAX_TRAIL - 1] = 1.0; trailTimes[MAX_TRAIL - 1] = currentTime.current
      lastStampX = x; lastStampY = y; lastStampTime = currentTime.current
      mouseOver = true
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 0) return
      e.preventDefault()
      emitTouchPoint(e.touches[0])
    }
    function onTouchEnd() {
      mouseOver = false
      lastStampX = -1; lastStampY = -1; lastStampTime = -1
      prevMouseX = -1; prevMouseY = -1; prevMouseTime = -1
    }

    if (trailPositionsLoc || trailStrengthsLoc || trailTimesLoc) {
      canvas.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('mouseleave', onMouseLeave)
      canvas.addEventListener('click', onMouseClick)
      canvas.addEventListener('touchstart', onTouchStart, { passive: false })
      canvas.addEventListener('touchmove', onTouchMove, { passive: false })
      canvas.addEventListener('touchend', onTouchEnd)
      canvas.addEventListener('touchcancel', onTouchEnd)
    }

    for (let name in uniforms) customLocs.set(name, gl.getUniformLocation(shaderProgram, name))

    gl.uniform2f(resolutionLoc, canvas.width / scale, canvas.height / scale)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.disable(gl.DEPTH_TEST)

    let startTime: number | null = null
    let lastTimestamp = 0
    let textureInfo: Array<{ width: number; height: number; texture: WebGLTexture; location: WebGLUniformLocation | null }> = []

    function drawImage(tex: WebGLTexture, loc: WebGLUniformLocation, unit: TextureUnit) {
      if (!gl) return
      gl.uniform1i(loc, unit)
      gl.activeTexture(gl[`TEXTURE${unit}`])
      gl.bindTexture(gl.TEXTURE_2D, tex)
    }

    function render(timestamp: number) {
      if (!gl || !ctx) return
      if (state.current === 'paused') { raf = window.requestAnimationFrame(render); return }
      let now = timestamp / 1000
      if (startTime === null) startTime = now
      if (maxFps !== Infinity) {
        if (timestamp - lastTimestamp < 1000 / maxFps) { raf = window.requestAnimationFrame(render); return }
        lastTimestamp = timestamp
      }
      currentTime.current = now - startTime
      onRender?.(currentTime.current)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.uniform1f(timeLoc, currentTime.current)
      gl.uniform1f(scrollLoc, window.scrollY)
      gl.uniform1f(eventTimeLoc, eventTime.current)
      const decay = mouseDecayRef.current
      for (let i = 0; i < MAX_TRAIL; i++) trailStrengths[i] *= (1 - decay)
      if (trailPositionsLoc) gl.uniform2fv(trailPositionsLoc, trailPositions)
      if (trailStrengthsLoc) gl.uniform1fv(trailStrengthsLoc, trailStrengths)
      if (trailTimesLoc) gl.uniform1fv(trailTimesLoc, trailTimes)
      const currentUniforms = uniformsRef.current
      for (let name in currentUniforms) {
        let location = customLocs.get(name) ?? null
        let uniform = currentUniforms[name]
        if (uniform.type === 'uniform1f') gl.uniform1f(location, uniform.value)
        else if (uniform.type === 'uniform3f') gl.uniform3f(location, uniform.value[0], uniform.value[1], uniform.value[2])
        else if (uniform.type === 'uniform1fv') gl.uniform1fv(location, uniform.value)
        else if (uniform.type === 'uniform3fv') gl.uniform3fv(location, uniform.value.flat())
        else if (uniform.type === 'uniform1i') gl.uniform1i(location, uniform.value)
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      for (let i = 0; i < textureInfo.length; i++) {
        const info = textureInfo[i]
        if (info.location) drawImage(info.texture, info.location, i as TextureUnit)
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (offscreenCanvas.width > 0 && offscreenCanvas.height > 0) ctx.drawImage(offscreenCanvas, 0, 0)
      raf = window.requestAnimationFrame(render)
    }

    async function start() {
      for (let i = 0; i < textures.length; i++) {
        try { textureInfo.push(await loadImageAndCreateTextureInfo(gl, shaderProgram, textures[i], i as TextureUnit)) }
        catch { return }
      }
      if (gl) raf = window.requestAnimationFrame(render)
    }
    start()

    function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
      const program = gl.createProgram()!
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program))
        return null
      }
      return program
    }

    let observer = new ResizeObserver(() => {
      canvas.width = offscreenCanvas.width = canvas.offsetWidth * scale
      canvas.height = offscreenCanvas.height = canvas.offsetHeight * scale
      gl?.uniform2f(resolutionLoc, canvas.width / scale, canvas.height / scale)
    })
    observer.observe(canvas)

    return () => {
      window.cancelAnimationFrame(raf)
      observer.disconnect()
      if (trailPositionsLoc || trailStrengthsLoc || trailTimesLoc) {
        canvas.removeEventListener('mousemove', onMouseMove)
        canvas.removeEventListener('mouseleave', onMouseLeave)
        canvas.removeEventListener('click', onMouseClick)
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove', onTouchMove)
        canvas.removeEventListener('touchend', onTouchEnd)
        canvas.removeEventListener('touchcancel', onTouchEnd)
      }
      if (gl) {
        gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader)
        gl.deleteProgram(shaderProgram); gl.deleteBuffer(vertexBuffer)
        for (let { texture } of textureInfo) gl.deleteTexture(texture)
        gl = null
      }
      ctx = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragmentShaderSource, maxFps, textures.join('')])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-hidden />
})
