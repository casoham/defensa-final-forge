/* Motor de las presentaciones de Soham: navegación, transiciones que guían, pasos, cifras y fondo vivo. */
(() => {
  const escenario = document.getElementById('escenario');
  const diapositivas = [...escenario.querySelectorAll(':scope > section')];
  const notas = document.getElementById('notas');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  diapositivas.forEach((d, i) => d.querySelectorAll('.pag').forEach((p) => { p.textContent = i + 1; }));
  let actual = -1;
  let escala = 1;

  function ajustar() {
    escala = Math.min(innerWidth / 1920, innerHeight / 1080);
    escenario.style.transform = 'scale(' + escala + ') translate(-50%, -50%)';
    document.documentElement.style.setProperty('--e', escala);
    // Lo que sobra a los lados o arriba y abajo (en px de la diapositiva): el fondo de la diapositiva lo cubre
    document.documentElement.style.setProperty('--mx', Math.max(0, (innerWidth / escala - 1920) / 2) + 1 + 'px');
    document.documentElement.style.setProperty('--my', Math.max(0, (innerHeight / escala - 1080) / 2) + 1 + 'px');
  }
  const pasos = (d) => [...d.querySelectorAll('.fragment')];
  const CLASES = ['activa', 'sale-adelante', 'sale-atras', 'llega-adelante', 'llega-atras', 'mismo-grupo'];

  // Cifras que cuentan desde 0
  function contar(d) {
    d.querySelectorAll('[data-contar]').forEach((el) => {
      const meta = Number(el.dataset.contar);
      if (quieto) { el.textContent = el.hasAttribute('data-miles') ? meta.toLocaleString('en-US') : meta; return; }
      const inicio = performance.now() + 450;
      el.textContent = '0';
      const paso = (t) => {
        const p = Math.min(1, Math.max(0, (t - inicio) / 1300));
        const v = Math.round(meta * (1 - Math.pow(1 - p, 3))); el.textContent = el.hasAttribute('data-miles') ? v.toLocaleString('en-US') : v;
        if (p < 1 && d.classList.contains('activa')) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }

  // Una imagen grande sale de su miniatura (.mini.actual → .etapa-img): crece, gira y se asienta
  function desdeMiniatura(d) {
    const grande = d.querySelector('.etapa-img');
    const mini = d.querySelector('.mini.actual');
    if (!grande || !mini || quieto) return;
    requestAnimationFrame(() => {
      const a = mini.getBoundingClientRect();
      const b = grande.getBoundingClientRect();
      const dx = (a.left + a.width / 2 - (b.left + b.width / 2)) / escala;
      const dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / escala;
      const s = a.width / b.width;
      grande.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(-28deg)`, opacity: 0.4 },
        { transform: 'translate(0, 0) scale(1.05) rotate(4deg)', opacity: 1, offset: 0.72 },
        { transform: 'none', opacity: 1 },
      ], { duration: 1150, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'both', delay: 150 });
      mini.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' });
    });
  }

  // ===== Transiciones de agua: una ola, una cascada, ondas o una botella cruzan la pantalla y, mientras
  // cubren todo, se cambia la diapositiva. Se elige con data-trans en la diapositiva que llega. =====
  const agua = escenario.hasAttribute('data-agua');
  let ocupado = false;
  const NS = 'http://www.w3.org/2000/svg';
  // El velo cubre TODA la pantalla (también las franjas que quedan a los lados o arriba y abajo en pantalla completa):
  // se dibuja en coordenadas de la diapositiva (1920×1080) y se extiende por los márgenes px, py.
  function capaSvg(w, h, d, fill, hh) {
    return '<svg xmlns="' + NS + '" width="' + w + '" height="' + (hh || h) + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="position:absolute;left:0;top:0"><path d="' + d + '" fill="' + fill + '"/></svg>';
  }
  function margenes() { return { px: Math.max(0, (innerWidth / escala - 1920) / 2), py: Math.max(0, (innerHeight / escala - 1080) / 2) }; }
  function velo() {
    let g = document.getElementById('velo');
    if (!g) {
      g = document.createElement('div'); g.id = 'velo'; g.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;overflow:hidden;z-index:60;pointer-events:none;';
      const s = document.createElement('div'); s.style.cssText = 'position:absolute;left:50%;top:50%;width:1920px;height:1080px;transform-origin:0 0;'; g.appendChild(s); document.body.appendChild(g);
    }
    const s = g.firstChild; s.style.transform = 'scale(' + escala + ') translate(-50%, -50%)'; s.innerHTML = ''; return s;
  }
  const BOTELLA = '<svg class="botella" xmlns="' + NS + '" viewBox="0 0 220 560" width="393" height="1000" style="position:absolute;left:-536px;top:40px;transform:rotate(-90deg);filter:drop-shadow(0 30px 40px rgba(10,40,120,.35))">'
    + '<defs><linearGradient id="bg" x1="0" x2="1"><stop offset="0" stop-color="#e7f7ff"/><stop offset=".5" stop-color="#bfe8fb"/><stop offset="1" stop-color="#9fd9f5"/></linearGradient></defs>'
    + '<rect x="70" y="2" width="80" height="48" rx="10" fill="#1b2a9b"/><g stroke="#3a4bd0" stroke-width="3"><path d="M82 10v34M94 10v34M106 10v34M118 10v34M130 10v34M142 10v34"/></g>'
    + '<rect x="76" y="50" width="68" height="34" fill="#d6f0fd"/>'
    + '<path d="M76 84C76 118 18 126 18 190V520Q18 552 52 552H168Q202 552 202 520V190C202 126 144 118 144 84Z" fill="url(#bg)" stroke="#7cc8ee" stroke-width="3"/>'
    + '<rect x="18" y="236" width="184" height="150" fill="#1c6ee8"/>'
    + '<image href="recursos/logo-a.png" x="34" y="268" width="152" height="80" preserveAspectRatio="xMidYMid meet"/>'
    + '<rect x="36" y="140" width="14" height="360" rx="7" fill="#fff" opacity=".55"/><rect x="170" y="150" width="8" height="200" rx="4" fill="#fff" opacity=".35"/></svg>';
  function ola(dir, swap, fin, conBotella) {
    const W = 4300;
    const d = 'M120 0 q-90 90 0 180 t0 180 t0 180 t0 180 t0 180 t0 180 H' + (W - 120) + ' q90 -90 0 -180 t0 -180 t0 -180 t0 -180 t0 -180 t0 -180 Z';
    const v = velo(); const flip = dir < 0 ? -1 : 1; const m = margenes();
    v.innerHTML = '<div style="position:absolute;left:' + (-m.px) + 'px;right:' + (-m.px) + 'px;top:0;bottom:0;transform:scaleX(' + flip + ')">' + [['#eafaff', 0], ['#62c8f2', 150], ['#1b2a9b', 310]].map(function (p, i) {
      return '<div class="capa-ola" style="position:absolute;left:0;top:' + (-m.py) + 'px;width:' + W + 'px;height:' + (1080 + 2 * m.py) + 'px;will-change:transform">' + capaSvg(W, 1080, d, p[0], 1080 + 2 * m.py) + (i === 0 && conBotella ? BOTELLA.replace('top:40px', 'top:' + (40 + m.py) + 'px') : '') + '</div>';
    }).join('') + '</div>';
    const capas = [...v.querySelectorAll('.capa-ola')]; const dur = conBotella ? 1500 : 1250;
    capas.forEach((c, i) => c.animate([{ transform: 'translateX(' + (2320 + 2 * m.px) + 'px)' }, { transform: 'translateX(' + (-W - 300 - 2 * m.px) + 'px)' }], { duration: dur, delay: i * 80, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }));
    const b = v.querySelector('.botella'); if (b) b.animate([{ transform: 'rotate(-93deg)' }, { transform: 'rotate(-87deg)' }, { transform: 'rotate(-93deg)' }], { duration: 700, iterations: 3, easing: 'ease-in-out' });
    setTimeout(swap, dur * 0.52 + 160); setTimeout(() => { v.innerHTML = ''; fin(); }, dur + 260);
  }
  function cascada(dir, swap, fin) {
    const H = 2700; let d = 'M0 120'; for (let i = 0; i < 12; i++) d += i ? ' t160 0' : ' q80 -90 160 0'; d += ' V' + (H - 120); for (let i = 0; i < 12; i++) d += i ? ' t-160 0' : ' q-80 90 -160 0'; d += ' Z';
    const v = velo(); const m = margenes(); const rayas = Array.from({ length: 26 }, (_, k) => '<rect x="' + (40 + k * 74) + '" y="' + (200 + (k * 137) % 1500) + '" width="5" height="' + (160 + (k * 53) % 260) + '" rx="3" fill="#fff" opacity=".35"/>').join('');
    v.innerHTML = [['#eafaff', 0], ['#62c8f2', 120], ['#1b2a9b', 260]].map(function (p, i) {
      return '<div class="capa-ola" style="position:absolute;left:' + (-m.px) + 'px;top:0;width:' + (1920 + 2 * m.px) + 'px;height:' + H + 'px;will-change:transform"><svg xmlns="' + NS + '" width="' + (1920 + 2 * m.px) + '" height="' + H + '" viewBox="0 0 1920 ' + H + '" preserveAspectRatio="none"><path d="' + d + '" fill="' + p[0] + '"/>' + (i === 2 ? rayas : '') + '</svg></div>';
    }).join('');
    const dur = 1250; [...v.querySelectorAll('.capa-ola')].forEach((c, i) => c.animate([{ transform: 'translateY(' + (-H - 200 - m.py) + 'px)' }, { transform: 'translateY(' + (1300 + 2 * m.py) + 'px)' }], { duration: dur, delay: i * 90, easing: 'cubic-bezier(.55,0,.45,1)', fill: 'both' }));
    setTimeout(swap, dur * 0.5 + 140); setTimeout(() => { v.innerHTML = ''; fin(); }, dur + 300);
  }
  function ondas(dir, swap, fin) {
    const v = velo(); const m = margenes(); const x = 960, y = 1000; const gx = x + m.px, gy = y + m.py, R = 2300 + Math.max(m.px, m.py);
    v.innerHTML = '<div class="disco" style="position:absolute;left:' + (-m.px) + 'px;right:' + (-m.px) + 'px;top:' + (-m.py) + 'px;bottom:' + (-m.py) + 'px;background:radial-gradient(circle at ' + gx + 'px ' + gy + 'px,#62c8f2 0%,#1c6ee8 45%,#1b2a9b 100%)"></div>'
      + [0, 1, 2].map(() => '<i class="anillo" style="position:absolute;left:' + (x - 160) + 'px;top:' + (y - 160) + 'px;width:320px;height:320px;border:6px solid #fff;border-radius:50%;opacity:0"></i>').join('');
    const disco = v.querySelector('.disco');
    disco.animate([{ clipPath: 'circle(0px at ' + gx + 'px ' + gy + 'px)' }, { clipPath: 'circle(' + R + 'px at ' + gx + 'px ' + gy + 'px)' }], { duration: 700, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' });
    v.querySelectorAll('.anillo').forEach((a, i) => a.animate([{ transform: 'scale(.1)', opacity: .9 }, { transform: 'scale(9)', opacity: 0 }], { duration: 1100, delay: i * 160, easing: 'ease-out', fill: 'both' }));
    setTimeout(swap, 720);
    setTimeout(() => disco.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'both' }), 760);
    setTimeout(() => { v.innerHTML = ''; fin(); }, 1500);
  }
  // ===== Transiciones De Panas: un ticket que se imprime y sale, o una arepa que cruza rodando. =====
  function zigzag(w, y, alto, sube) { const pts = []; for (let x = 0; x <= w + 36; x += 36) pts.push([Math.min(x, w), y + ((x / 36) % 2 ? (sube ? -alto : alto) : 0)]); return pts; }
  function ticket(dir, swap, fin) {
    const v = velo(); const m = margenes(); const W = 1920 + 2 * m.px, H = 1080 + 2 * m.py + 80;
    const raiz = getComputedStyle(document.documentElement);
    const papel = raiz.getPropertyValue('--velo-papel').trim() || '#FFFCF5';
    const tinta = raiz.getPropertyValue('--velo-tinta').trim() || '#E6DCC8';
    let renglones = '';
    for (let y = 170, k = 0; y < H - 150; y += 92, k++) {
      const largo = 240 + ((k * 197) % 480);
      renglones += '<rect x="' + (W / 2 - 520) + '" y="' + y + '" width="' + largo + '" height="22" rx="11" fill="' + tinta + '"/>'
        + '<rect x="' + (W / 2 + 520 - (110 + (k * 53) % 80)) + '" y="' + y + '" width="' + (110 + (k * 53) % 80) + '" height="22" rx="11" fill="' + tinta + '"/>';
    }
    const arriba = zigzag(W, 28, 26, true), abajo = zigzag(W, H - 28, 26, false).reverse();
    const d = 'M' + arriba.map((p) => p.join(' ')).join(' L') + ' L' + abajo.map((p) => p.join(' ')).join(' L') + ' Z';
    v.innerHTML = '<div class="papel" style="position:absolute;left:' + (-m.px) + 'px;top:' + (-m.py - 40) + 'px;width:' + W + 'px;height:' + H + 'px;will-change:transform;filter:drop-shadow(0 30px 50px rgba(15,51,30,.35))">'
      + '<svg xmlns="' + NS + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="position:absolute;left:0;top:0"><path d="' + d + '" fill="' + papel + '"/>' + renglones + '</svg></div>';
    const p = v.querySelector('.papel'); const s = dir < 0 ? -1 : 1;
    p.animate([{ transform: 'translateY(' + (-s * (H + 60)) + 'px)' }, { transform: 'translateY(0)' }], { duration: 620, easing: 'cubic-bezier(.25,.8,.25,1)', fill: 'both' });
    setTimeout(swap, 640);
    setTimeout(() => p.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(' + (s * (H + 160)) + 'px) rotate(' + (s * 3) + 'deg)' }], { duration: 560, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'both' }), 760);
    setTimeout(() => { v.innerHTML = ''; fin(); }, 1360);
  }
  function arepa(dir, swap, fin) {
    const v = velo(); const m = margenes(); const W = 1920 + 2 * m.px, H = 1080 + 2 * m.py; const R = 300; const s = dir < 0 ? -1 : 1;
    v.innerHTML = '<div class="banda" style="position:absolute;left:' + (-m.px) + 'px;top:' + (-m.py) + 'px;width:' + W + 'px;height:' + H + 'px;will-change:transform">'
      + '<div style="position:absolute;inset:0;background:#EF7D05"></div>'
      + '<img class="rueda" src="recursos/arepa.png" alt="" style="position:absolute;left:' + (s > 0 ? W - R : -R) + 'px;top:' + (H / 2 - R) + 'px;width:' + 2 * R + 'px;height:' + 2 * R + 'px;filter:drop-shadow(0 24px 30px rgba(15,51,30,.35))"></div>';
    const b = v.querySelector('.banda'); const dur = 1500; const ini = -s * (W + R + 40), finX = s * (W + R + 40);
    const curva = 'cubic-bezier(.55,0,.45,1)';
    b.animate([{ transform: 'translateX(' + ini + 'px)' }, { transform: 'translateX(0)', offset: 0.45 }, { transform: 'translateX(0)', offset: 0.55 }, { transform: 'translateX(' + finX + 'px)' }], { duration: dur, easing: curva, fill: 'both' });
    v.querySelector('.rueda').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(' + s * 900 + 'deg)' }], { duration: dur, easing: curva, fill: 'both' });
    setTimeout(swap, dur * 0.5); setTimeout(() => { v.innerHTML = ''; fin(); }, dur + 80);
  }
  function transicion(tipo, dir, swap, fin) {
    if (tipo === 'arepa') arepa(dir, swap, fin);
    else ticket(dir, swap, fin);
  }
  // Dos direcciones visuales para elegir en el piloto: ?dir=papel o tecla D
  const dirs = ['noche', 'papel'];
  document.documentElement.dataset.dir = new URLSearchParams(location.search).get('dir') || 'noche';
  addEventListener('keydown', (e) => { if (e.key === 'd' || e.key === 'D') { const k = dirs.indexOf(document.documentElement.dataset.dir); document.documentElement.dataset.dir = dirs[(k + 1) % 2]; } });

  // ===== Como en PowerPoint (sirve con el control remoto) =====
  // F5 o Mayús+F5: pantalla completa · Esc: salir · B o punto: pantalla negra · W o coma: pantalla blanca.
  // Con la pantalla en negro o blanco, cualquier tecla o clic la devuelve sin avanzar.
  // La primera tecla de avance o el primer clic al abrir entran a pantalla completa en vez de avanzar.
  const telon = document.createElement('div'); telon.id = 'telon'; telon.setAttribute('aria-hidden', 'true'); document.body.appendChild(telon);
  const inicio = document.createElement('button'); inicio.id = 'inicio'; inicio.type = 'button';
  inicio.textContent = 'Presentar en pantalla completa · F5'; document.body.appendChild(inicio);
  const completa = () => Boolean(document.fullscreenElement);
  const entrar = () => { if (!completa()) document.documentElement.requestFullscreen().catch(() => {}); };
  let primera = true;
  const quitarInicio = () => { primera = false; inicio.classList.add('oculto'); };
  document.addEventListener('fullscreenchange', () => { if (completa()) quitarInicio(); });
  const AVANCE = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'ArrowLeft', 'ArrowUp', 'PageUp'];
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const corta = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (telon.className) { corta(); telon.className = ''; return; }
    if (e.key === 'F5') { corta(); entrar(); return; }
    if (e.key === 'b' || e.key === 'B' || e.key === '.') { corta(); telon.className = 'negro'; return; }
    if (e.key === 'w' || e.key === 'W' || e.key === ',') { corta(); telon.className = 'blanco'; return; }
    if (primera && AVANCE.includes(e.key) && !completa()) { corta(); quitarInicio(); entrar(); }
    else if (AVANCE.includes(e.key)) quitarInicio();
  }, true);
  addEventListener('click', (e) => {
    if (telon.className) { e.stopImmediatePropagation(); telon.className = ''; return; }
    if (primera && !completa() && !notas.contains(e.target)) { e.stopImmediatePropagation(); quitarInicio(); entrar(); }
  }, true);

  function mostrar(i, todosLosPasos, direccion) {
    i = Math.max(0, Math.min(diapositivas.length - 1, i));
    if (i === actual) return;
    const n = diapositivas[i], vi = diapositivas[actual];
    if (agua && vi && !quieto && !(n.dataset.grupo && vi.dataset.grupo === n.dataset.grupo)) {
      if (ocupado) return; ocupado = true;
      transicion(n.dataset.trans || 'ola', direccion, () => cambiar(i, todosLosPasos, direccion), () => { ocupado = false; });
      return;
    }
    cambiar(i, todosLosPasos, direccion);
  }
  function cambiar(i, todosLosPasos, direccion) {
    if (i === actual) return;
    const vieja = diapositivas[actual];
    const nueva = diapositivas[i];
    const mismoGrupo = vieja && nueva.dataset.grupo && vieja.dataset.grupo === nueva.dataset.grupo;
    diapositivas.forEach((d) => { if (d !== vieja) d.classList.remove(...CLASES); });
    if (vieja) {
      vieja.classList.remove(...CLASES);
      if (!mismoGrupo && !quieto && !agua) {
        vieja.classList.add(direccion < 0 ? 'sale-atras' : 'sale-adelante');
        vieja.addEventListener('animationend', function fin(e) {
          if (e.target !== vieja) return;
          vieja.classList.remove('sale-atras', 'sale-adelante');
          vieja.removeEventListener('animationend', fin);
        });
      }
      vieja.querySelectorAll('video').forEach((v) => v.pause());
    }
    nueva.classList.add('activa');
    document.body.dataset.clases = [...nueva.classList].filter((c) => !CLASES.includes(c)).join(' ');
    if (vieja && !quieto && !agua) nueva.classList.add(mismoGrupo ? 'mismo-grupo' : direccion < 0 ? 'llega-atras' : 'llega-adelante');
    nueva.querySelectorAll('video').forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); });
    pasos(nueva).forEach((f) => f.classList.toggle('visible', Boolean(todosLosPasos)));
    if (nueva.dataset.pasos) ponerPaso(nueva, todosLosPasos ? Number(nueva.dataset.pasos) : 0);
    actual = i;
    contar(nueva);
    desdeMiniatura(nueva);
    const nota = nueva.querySelector('aside');
    notas.textContent = nota ? nota.textContent : '';
    history.replaceState(null, '', '#' + (i + 1));
    if (quieto) requestAnimationFrame(dibujar);
  }
  // Diapositivas con pasos propios (data-pasos): cada clic suma un paso y la sección recibe p1…pN
  function ponerPaso(d, k) {
    d.dataset.paso = k;
    d.style.setProperty('--paso', k);
    for (let j = 1; j <= Number(d.dataset.pasos); j++) d.classList.toggle('p' + j, j <= k);
  }
  function siguiente() {
    const d = diapositivas[actual];
    if (d.dataset.pasos && Number(d.dataset.paso) < Number(d.dataset.pasos)) { ponerPaso(d, Number(d.dataset.paso) + 1); return; }
    const pendiente = pasos(diapositivas[actual]).find((f) => !f.classList.contains('visible'));
    if (pendiente) pendiente.classList.add('visible');
    else if (actual < diapositivas.length - 1) mostrar(actual + 1, false, 1);
  }
  function anterior() {
    const d = diapositivas[actual];
    if (d.dataset.pasos && Number(d.dataset.paso) > 0) { ponerPaso(d, Number(d.dataset.paso) - 1); return; }
    const vistos = pasos(diapositivas[actual]).filter((f) => f.classList.contains('visible'));
    if (vistos.length) vistos[vistos.length - 1].classList.remove('visible');
    else if (actual > 0) mostrar(actual - 1, true, -1);
  }

  // Fondo vivo: retícula isométrica que se desliza y pulsos de luz que la recorren
  const C30 = Math.cos(Math.PI / 6), S30 = Math.sin(Math.PI / 6);
  const pulsos = Array.from({ length: 9 }, () => nuevoPulso(true));
  function nuevoPulso(inicial) {
    const sube = Math.random() < 0.5;
    return { x: inicial ? Math.random() * 1920 : -150, y: Math.random() * 1080 + (sube ? 300 : -300), vx: C30, vy: sube ? -S30 : S30, v: 0.6 + Math.random() * 0.9, largo: 90 + Math.random() * 120 };
  }
  let desplazamiento = 0;
  function dibujar() {
    const d = diapositivas[actual];
    const lienzo = d && d.querySelector('.ambiente');
    if (lienzo) {
      const g = lienzo.getContext('2d');
      const oscuro = true;
      const base = getComputedStyle(d).getPropertyValue('--pulso').trim() || '106,165,255';
      g.clearRect(0, 0, 1920, 1080);
      g.lineWidth = 1;
      g.strokeStyle = `rgba(${base},${oscuro ? 0.06 : 0.055})`;
      const paso = 110;
      const off = desplazamiento % paso;
      g.beginPath();
      for (let k = -2200; k < 3200; k += paso) {
        const b = k + off;
        g.moveTo(b, 0); g.lineTo(b + 1080 * C30 / S30, 1080);
        g.moveTo(b, 1080); g.lineTo(b + 1080 * C30 / S30, 0);
      }
      g.stroke();
      for (const p of pulsos) {
        const grad = g.createLinearGradient(p.x - p.vx * p.largo, p.y - p.vy * p.largo, p.x, p.y);
        grad.addColorStop(0, `rgba(${base},0)`);
        grad.addColorStop(1, `rgba(${base},${oscuro ? 0.35 : 0.28})`);
        g.strokeStyle = grad;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(p.x - p.vx * p.largo, p.y - p.vy * p.largo);
        g.lineTo(p.x, p.y);
        g.stroke();
        g.fillStyle = `rgba(${base},${oscuro ? 0.5 : 0.35})`;
        g.beginPath(); g.arc(p.x, p.y, 2.5, 0, Math.PI * 2); g.fill();
        if (!quieto) { p.x += p.vx * p.v; p.y += p.vy * p.v; }
        if (p.x > 2100 || p.y < -200 || p.y > 1280) Object.assign(p, nuevoPulso(false));
      }
      if (!quieto) desplazamiento += 0.12;
    }
    if (!quieto) requestAnimationFrame(dibujar);
  }

  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); siguiente(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); anterior(); }
    else if (e.key === 'Home') mostrar(0, false, -1);
    else if (e.key === 'End') mostrar(diapositivas.length - 1, true, 1);
    else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    else if (e.key === 'n' || e.key === 'N') notas.classList.toggle('abierta');
  });
  addEventListener('click', (e) => { if (!notas.contains(e.target)) (e.clientX < innerWidth / 4 ? anterior : siguiente)(); });
  let x0 = null;
  addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) (dx < 0 ? siguiente : anterior)(); x0 = null; });
  let reposo;
  addEventListener('mousemove', () => { document.body.classList.add('raton'); clearTimeout(reposo); reposo = setTimeout(() => document.body.classList.remove('raton'), 1800); });
  addEventListener('resize', ajustar);
  ajustar();
  mostrar((parseInt(location.hash.slice(1), 10) || 1) - 1, false, 1);
  requestAnimationFrame(dibujar);
})();
