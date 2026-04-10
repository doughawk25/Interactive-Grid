import { forwardRef, useMemo } from 'react'
import { Shader, type ShaderHandle, type Uniforms } from './Shader'

type Color = [r: number, g: number, b: number]

interface DotsProps {
  colors?: [Color] | [Color, Color] | [Color, Color, Color]
  opacities?: [number, number, number, number, number, number, number, number, number, number]
  totalSize?: number
  dotSize?: number
  shader?: string
  init?: string
  center?: Array<'x' | 'y'>
  textures?: Array<string>
  uniforms?: Uniforms
  mode?: 'trail' | 'ripple'
  mouseDecay?: number
  mouseRingInner?: number
  mouseRingOuter?: number
  rippleSpeed?: number
  rippleWidth?: number
  rippleLifetime?: number
  glowColor?: [number, number, number]
  gradientDir?: 0 | 1 | 2 | 3 | 4
  gradientGamma?: number
  dotShape?: 'square' | 'circle'
  activeScale?: number
  activeGlow?: boolean
}

function getFragmentShader({
  init = '',
  shader = '',
  center = ['x', 'y'],
  dotShape = 'square',
  activeGlow = true,
}: Pick<DotsProps, 'init' | 'shader' | 'center' | 'dotShape' | 'activeGlow'>) {
  return `#version 300 es
precision mediump float;

in vec2 fragCoord;

uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;
uniform vec2 u_trail_positions[150];
uniform float u_trail_strengths[150];
uniform float u_trail_times[150];
uniform float u_mode;
uniform float u_ring_inner;
uniform float u_ring_outer;
uniform float u_ripple_speed;
uniform float u_ripple_width;
uniform float u_ripple_lifetime;
uniform vec3 u_glow_color;
uniform float u_gradient_dir;
uniform float u_gradient_gamma;
uniform float u_active_scale;
${init}

out vec4 fragColor;

float PHI = 1.61803398874989484820459;
float random(vec2 xy) {
  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}

void main() {
  vec2 st = fragCoord.xy;

  ${center.includes('x') ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));' : ''}
  ${center.includes('y') ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));' : ''}

  float opacity = step(0.0, st.x);
  opacity *= step(0.0, st.y);

  vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);
  opacity *= u_opacities[int(rand * 10.0)];

  float mouseProximity = 0.0;
  vec2 dotCenter = (st2 + vec2(0.5)) * u_total_size;

  if (u_mode < 0.5) {
    for (int i = 0; i < 150; i++) {
      float s = u_trail_strengths[i];
      if (s > 0.005 && u_trail_positions[i].x >= 0.0) {
        float d = distance(dotCenter, u_trail_positions[i]);
        float inner = smoothstep(0.0, u_ring_inner, d);
        float outer = 1.0 - smoothstep(u_ring_inner, u_ring_outer, d);
        mouseProximity += inner * outer * s;
      }
    }
  } else {
    float tFall = 3.0 / max(u_ripple_lifetime, 0.001);
    float dFall = 0.005;
    float sigma = max(u_ripple_width * 0.5, 1.0);
    float rippleSum = 0.0;
    for (int i = 0; i < 150; i++) {
      if (u_trail_times[i] < 0.0 || u_trail_positions[i].x < 0.0) continue;
      float age = u_time - u_trail_times[i];
      if (age < 0.0 || age > u_ripple_lifetime) continue;
      float amp = u_trail_strengths[i];
      float d = distance(dotCenter, u_trail_positions[i]);
      float wavefront = age * u_ripple_speed;
      float ring = amp * exp(-0.5 * pow((d - wavefront) / sigma, 2.0));
      ring /= 1.0 + d * dFall;
      ring *= exp(-age * tFall);
      rippleSum += ring;
    }
    mouseProximity += clamp(tanh(rippleSum), 0.0, 1.0);
  }

  mouseProximity = clamp(mouseProximity, 0.0, 1.0);

  float effectiveSize = u_dot_size * (1.0 + u_active_scale * mouseProximity);
  effectiveSize = min(effectiveSize, u_total_size * 0.97);
  ${dotShape === 'circle' ? `
  vec2 cellUV = fract(st / u_total_size) - 0.5;
  float r = effectiveSize / u_total_size * 0.5;
  opacity *= step(length(cellUV), r);
  ` : `
  opacity *= 1.0 - step(effectiveSize / u_total_size, fract(st.x / u_total_size));
  opacity *= 1.0 - step(effectiveSize / u_total_size, fract(st.y / u_total_size));
  `}

  vec3 color = u_colors[int(show_offset * 6.0)];

  ${activeGlow ? `
  if (mouseProximity > 0.0) {
    float prox = smoothstep(0.0, 0.35, mouseProximity);
    color = mix(color, u_glow_color, prox * 0.85);
    opacity *= 1.0 + 1.5 * prox;
  }` : ''}

  ${shader}

  float nx = fragCoord.x / u_resolution.x;
  float ny = fragCoord.y / u_resolution.y;
  float grad = 1.0;
  if (u_gradient_dir < 0.5) { grad = 1.0; }
  else if (u_gradient_dir < 1.5) { grad = nx; }
  else if (u_gradient_dir < 2.5) { grad = 1.0 - nx; }
  else if (u_gradient_dir < 3.5) { grad = ny; }
  else { grad = 1.0 - ny; }
  opacity *= pow(clamp(grad, 0.001, 1.0), u_gradient_gamma);

  fragColor = vec4(color, opacity);
  fragColor.rgb *= fragColor.a;
}
`
}

export const Dots = forwardRef(function Dots(
  {
    colors = [[0, 0, 0]],
    opacities = [0.1, 0.1, 0.1, 0.15, 0.15, 0.2, 0.2, 0.25, 0.25, 0.4],
    totalSize = 4,
    dotSize = 2,
    init,
    textures,
    shader,
    center,
    uniforms: uniformsProp,
    mode = 'ripple',
    mouseDecay = 0.035,
    mouseRingInner = 40,
    mouseRingOuter = 160,
    rippleSpeed = 180,
    rippleWidth = 60,
    rippleLifetime = 2.2,
    glowColor = [108, 71, 255],
    gradientDir = 0,
    gradientGamma = 1,
    dotShape = 'square',
    activeScale = 2,
    activeGlow = true,
  }: DotsProps,
  ref: React.ForwardedRef<ShaderHandle>,
) {
  const uniforms = useMemo<Uniforms>(() => {
    let colorsValue = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]]
    if (colors.length === 2) colorsValue = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]]
    else if (colors.length === 3) colorsValue = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]]
    return {
      u_colors: { value: colorsValue.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255] as [number,number,number]), type: 'uniform3fv' },
      u_opacities: { value: opacities, type: 'uniform1fv' },
      u_total_size: { value: totalSize, type: 'uniform1f' },
      u_dot_size: { value: dotSize, type: 'uniform1f' },
      u_mode: { value: mode === 'ripple' ? 1.0 : 0.0, type: 'uniform1f' },
      u_ring_inner: { value: mouseRingInner, type: 'uniform1f' },
      u_ring_outer: { value: mouseRingOuter, type: 'uniform1f' },
      u_ripple_speed: { value: rippleSpeed, type: 'uniform1f' },
      u_ripple_width: { value: rippleWidth, type: 'uniform1f' },
      u_ripple_lifetime: { value: rippleLifetime, type: 'uniform1f' },
      u_glow_color: { value: [glowColor[0] / 255, glowColor[1] / 255, glowColor[2] / 255], type: 'uniform3f' },
      u_gradient_dir: { value: gradientDir, type: 'uniform1f' },
      u_gradient_gamma: { value: gradientGamma, type: 'uniform1f' },
      u_active_scale: { value: activeScale, type: 'uniform1f' },
      ...uniformsProp,
    }
  }, [colors, opacities, totalSize, dotSize, mode, mouseRingInner, mouseRingOuter, rippleSpeed, rippleWidth, rippleLifetime, glowColor, gradientDir, gradientGamma, activeScale, uniformsProp])

  return (
    <Shader
      ref={ref}
      source={getFragmentShader({ init, shader, center, dotShape, activeGlow })}
      textures={textures}
      uniforms={uniforms}
      maxFps={60}
      mouseDecay={mode === 'ripple' ? 0 : mouseDecay}
      useVelocityAmplitude={mode === 'ripple'}
    />
  )
})
