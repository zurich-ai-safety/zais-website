/* ZAIS hero background — animated WebGL mesh gradient.
 *
 * Ported from the Design Canvas export's shader-hero.jsx. The GLSL and the
 * uniform table below are copied verbatim; only the React wrapper was replaced
 * with a plain initialiser. Falls back silently to the CSS gradient painted on
 * the hero section when WebGL is unavailable.
 */
(function () {
  "use strict";

const VERT = `attribute vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec3 u_meta[8];    // falloff (tightness), amplitude, local drift radius
uniform vec3 u_home[8];    // fixed home centre .xy — the composition's zones
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, unused
uniform vec4 u_space;      // offset.xy, unused.zw

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#define u_seed u_transform.x
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_offset u_space.xy

float hash21(vec2 p){
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float grainHash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 shade(vec2 p, float t){
  vec3 acc = u_colors[6] * 0.0004;  // negligible floor, matched to the sharpened weight scale
  float total = 0.0004;
  for (int i = 0; i < 8; i++){
    if (float(i) >= u_colorCount) break;
    float fi = float(i);
    vec2 c = u_home[i].xy + u_meta[i].z * (0.72 + u_intensity * 0.56)
             * vec2(sin(t * (0.21 + fi * 0.071) + fi * 2.4 + u_seed),
                    cos(t * (0.17 + fi * 0.093) + fi * 1.7));
    float w = u_meta[i].y * exp(-dot(p - c, p - c) * u_meta[i].x);
    w = w * w * w * w;   // dominance sharpening — pure zones, smooth seams
    acc += u_colors[i] * w;
    total += w;
  }
  return acc / total;
}

void main(){
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.xy;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001){
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0)
    p += u_warp * (vec2(fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);

  vec3 col;
  if (u_blur > 0.0){
    float pe = u_blur * u_scale;
    col  = shade(p, u_time) * 0.36;
    col += shade(p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001){
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_brightness) > 0.0001) col += u_brightness;
  if (u_vignette > 0.0001){
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_grain > 0.0001)
    col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// ZAIS palette. meta = [falloff (higher = tighter blob), amplitude, orbit radius]
// Dark blue is deliberately tight + far out so it stays a corner accent;
// the two orange blobs carry the field and stay vivid.
const UNIFORMS = {
  colors: [
    [0.871, 0.173, 0.000], // #DE2C00 orange
    [0.871, 0.173, 0.000], // #DE2C00 orange (2nd phase)
    [0.008, 0.020, 0.133], // #020522 navy — corner depth
    [0.184, 0.365, 0.486], // #2F5D7C petrol blue — right-edge mass
    [0.725, 0.851, 0.863], // #B9D9DC pale ice blue — the cyan band
    [0.816, 0.753, 0.663], // #D0C0A9 warm sand
    [0.965, 0.949, 0.886], // #F6F2E2 cream
    [1.000, 1.000, 0.984], // #FFFFFB near-white
  ],
  // falloff, amplitude, LOCAL drift radius (blobs now breathe in place, not orbit)
  meta: [
    [5.0, 1.50, 0.10],  // orange      — big left mass
    [6.5, 1.40, 0.10],  // orange      — second phase, lower left
    [9.0, 1.55, 0.07],  // navy        — top-left corner depth
    [11.0, 1.70, 0.06], // petrol blue — right edge, above ice so the steel blue reads
    [10.0, 1.45, 0.07], // pale ice    — events column, clear of the left column
    [10.0, 1.00, 0.07], // sand        — warm transition
    [9.0, 1.25, 0.07],  // cream       — bottom right
    [9.0, 1.30, 0.06],  // near-white  — bottom-right corner glow
  ],
  // fixed home centres: +y is up. Text zones (left column, header, events column)
  // sit over the dark/orange/petrol end; the light glow stays low and right.
  home: [
    [-0.47, 0.06],   // 10% from left, upper-middle
    [-0.33, -0.35],  // lower left
    [-0.57, 0.57],   // top-left corner
    [0.58, 0.35],    // right edge, upper
    [0.35, 0.06],    // right, middle — behind the events column
    [0.14, -0.33],   // bottom centre-right
    [0.35, -0.52],   // bottom right
    [0.57, -0.57],   // bottom-right corner
  ],
  colorCount: 8,
  scale: 1.18,
  intensity: 0.5,
  warp: 0.18,
  detail: 1.7,
  contrast: 1.08,
  brightness: 0.03,
  saturation: 1.18,
  vignette: 0.06,
  blur: 0.0,
  grain: 0.03,
  seed: 3.0,
  rotate: 0.0,
  offsetX: -0.1,
  offsetY: 0.05,
  drift: 0.05,
  timeScale: 0.62,
};

  function initHeroShader(canvas) {

    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uni = {
      colors: gl.getUniformLocation(program, 'u_colors'),
      meta: gl.getUniformLocation(program, 'u_meta'),
      home: gl.getUniformLocation(program, 'u_home'),
      scene: gl.getUniformLocation(program, 'u_scene'),
      shape: gl.getUniformLocation(program, 'u_shape'),
      surface: gl.getUniformLocation(program, 'u_surface'),
      finish: gl.getUniformLocation(program, 'u_finish'),
      transform: gl.getUniformLocation(program, 'u_transform'),
      space: gl.getUniformLocation(program, 'u_space'),
    };
    const flat = [];
    UNIFORMS.colors.forEach(c => flat.push(c[0], c[1], c[2]));
    gl.uniform3fv(uni.colors, new Float32Array(flat));
    const flatMeta = [];
    UNIFORMS.meta.forEach(m => flatMeta.push(m[0], m[1], m[2]));
    gl.uniform3fv(uni.meta, new Float32Array(flatMeta));
    const flatHome = [];
    UNIFORMS.home.forEach(hp => flatHome.push(hp[0], hp[1], 0));
    gl.uniform3fv(uni.home, new Float32Array(flatHome));
    gl.uniform4f(uni.shape, UNIFORMS.scale, UNIFORMS.intensity, 0, UNIFORMS.warp);
    gl.uniform4f(uni.surface, UNIFORMS.detail, UNIFORMS.contrast, UNIFORMS.brightness, UNIFORMS.saturation);
    gl.uniform4f(uni.finish, 0, UNIFORMS.vignette, UNIFORMS.blur, UNIFORMS.grain);
    gl.uniform4f(uni.transform, UNIFORMS.seed, UNIFORMS.rotate, UNIFORMS.drift, 0);
    gl.uniform4f(uni.space, UNIFORMS.offsetX, UNIFORMS.offsetY, 0, 0);

    let bounds = canvas.getBoundingClientRect();
    let raf = 0;
    let disposed = false;
    let visible = document.visibilityState === 'visible';
    let inView = true;
    const start = performance.now();
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rw = Math.max(1, Math.round(bounds.width * dpr));
      const rh = Math.max(1, Math.round(bounds.height * dpr));
      const s = Math.min(1, Math.sqrt(2000000 / Math.max(1, rw * rh)));
      const w = Math.max(1, Math.round(rw * s));
      const h = Math.max(1, Math.round(rh * s));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const request = () => {
      if (!disposed && visible && inView && raf === 0) raf = requestAnimationFrame(render);
    };
    function render(now) {
      raf = 0;
      if (disposed || !visible || !inView) return;
      resize();
      gl.uniform4f(uni.scene, canvas.width, canvas.height,
        ((now - start) / 1000) * UNIFORMS.timeScale, UNIFORMS.colorCount);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced) request();
    }
    const relayout = () => { bounds = canvas.getBoundingClientRect(); resize(); request(); };
    window.addEventListener('resize', relayout);
    const ro = new ResizeObserver(relayout);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      inView = e ? e.isIntersecting : true;
      if (inView) request();
      else if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(canvas);
    const onVis = () => {
      visible = document.visibilityState === 'visible';
      if (visible) request();
      else if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; }
    };
    document.addEventListener('visibilitychange', onVis);
    request();
  }

  function boot() {
    var canvas = document.querySelector("canvas.hero-shader");
    if (!canvas) return;
    try {
      initHeroShader(canvas);
    } catch (err) {
      /* Leave the CSS gradient in place. */
      canvas.style.display = "none";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
