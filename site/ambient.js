// Animated version of the body's ambient gradient wash: a fullscreen WebGL
// shader draws the same three brand-colored glows, drifting and breathing on
// ~60s cycles. Ported from ambystech.io's AmbientBackground (Three.js there,
// raw WebGL here since the listing page has no bundler). The canvas paints
// opaquely over the static CSS gradients, which remain as the no-JS /
// reduced-motion / no-WebGL fallback. Non-interactive, pauses when the tab is hidden.
(() => {
  const canvas = document.getElementById('ambient-bg');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduceMotion) return;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
  if (!gl) return; // No WebGL: the static gradient background stays

  const vertex = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const fragment = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uRes;
    varying vec2 vUv;

    float blob(vec2 uv, vec2 center, float radius) {
      vec2 d = uv - center;
      d.x *= uRes.x / uRes.y;
      return exp(-dot(d, d) / (radius * radius));
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime;
      vec3 col = vec3(0.039, 0.051, 0.078); // deep #0A0D14

      // Same three glows as the static CSS wash, flowing on ~35-45s cycles
      vec2 orchidC   = vec2(0.84 + 0.11 * sin(t * 0.18),        1.00 + 0.09 * cos(t * 0.14));
      vec2 blueC     = vec2(-0.08 + 0.13 * cos(t * 0.13),       0.60 + 0.14 * sin(t * 0.16));
      vec2 fuchsiaC  = vec2(0.70 + 0.14 * sin(t * 0.11 + 2.0),  0.02 + 0.10 * cos(t * 0.17 + 1.0));

      float orchid  = blob(uv, orchidC,  0.46) * (0.30 + 0.08 * sin(t * 0.15));
      float blue    = blob(uv, blueC,    0.42) * (0.23 + 0.07 * cos(t * 0.12 + 1.7));
      float fuchsia = blob(uv, fuchsiaC, 0.36) * (0.17 + 0.07 * sin(t * 0.13 + 3.1));

      col += vec3(0.600, 0.196, 0.800) * orchid;  // dark orchid
      col += vec3(0.235, 0.412, 0.906) * blue;    // bluetiful
      col += vec3(0.933, 0.067, 0.600) * fuchsia; // fanatic fuchsia

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };

  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  // One triangle that covers the whole viewport
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'uTime');
  const uRes = gl.getUniformLocation(program, 'uRes');

  // Soft glows need almost no resolution: render at half size for cheap frames
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.max(1, Math.round(w * 0.5));
    canvas.height = Math.max(1, Math.round(h * 0.5));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, w, h);
  };
  resize();

  let raf = 0;
  const tick = (t) => {
    gl.uniform1f(uTime, t / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(tick);
    }
  });

  window.addEventListener('resize', resize);
})();
