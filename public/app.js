'use strict';
const el = id => document.getElementById(id);
const canvas = el('photo');
const ctx = canvas.getContext('2d');
const inputs = ['x1', 'y1', 'x2', 'y2'].map(el);
const percent = p => (100 * p).toLocaleString('es-PE', { maximumFractionDigits: 2 }) + ' %';
let info, image, file, box, start, pointer;
let version = 0, imageVersion = 0;

function draw(region = box) {
  if (!image) return;
  ctx.drawImage(image, 0, 0);
  if (!region) return;
  const [x, y, right, bottom] = region;
  ctx.strokeStyle = '#a6edce';
  ctx.fillStyle = '#a6edce33';
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, right - x, bottom - y);
  ctx.strokeRect(x, y, right - x, bottom - y);
}

function select(region, updateInputs = true) {
  box = region;
  version++;
  if (updateInputs) inputs.forEach((input, i) => input.value = region ? region[i] : '');
  el('classify').disabled = !box;
  el('clear').disabled = !box && !inputs.some(input => input.value);
  el('output').hidden = true;
  el('status').textContent = '';
  draw();
}

function valid(region) {
  const [x, y, right, bottom] = region;
  return image && region.every(Number.isInteger) && x >= 0 && y >= 0 &&
    x < right && y < bottom && right <= canvas.width && bottom <= canvas.height;
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return [
    Math.round(Math.min(canvas.width, Math.max(0, (event.clientX - rect.left) * canvas.width / rect.width))),
    Math.round(Math.min(canvas.height, Math.max(0, (event.clientY - rect.top) * canvas.height / rect.height))),
  ];
}

function rectangle(event) {
  const [x, y] = point(event);
  return [Math.min(x, start[0]), Math.min(y, start[1]), Math.max(x, start[0]), Math.max(y, start[1])];
}

canvas.addEventListener('pointerdown', event => {
  if (!image || pointer !== undefined || event.button !== 0) return;
  start = point(event);
  pointer = event.pointerId;
  canvas.setPointerCapture(pointer);
});
canvas.addEventListener('pointermove', event => {
  if (event.pointerId === pointer) draw(rectangle(event));
});
canvas.addEventListener('pointerup', event => {
  if (event.pointerId !== pointer) return;
  pointer = undefined;
  const region = rectangle(event);
  if (valid(region)) select(region);
  else draw();
});
canvas.addEventListener('lostpointercapture', event => {
  if (pointer === event.pointerId) {
    pointer = undefined;
    draw();
  }
});
inputs.forEach(input => input.addEventListener('input', () => {
  const region = inputs.map(field => field.valueAsNumber);
  select(valid(region) ? region : null, false);
}));
el('clear').addEventListener('click', () => select(null));

function report(error) {
  el('status').textContent = error.name === 'EncodingError'
    ? 'Usa una imagen JPG, PNG o WebP válida.' : error.message;
}

async function openImage(source, title, region, request) {
  const url = URL.createObjectURL(source);
  try {
    const next = new Image();
    next.src = url;
    await next.decode();
    if (request !== imageVersion) return;
    if (next.naturalWidth * next.naturalHeight > 20_000_000) {
      throw new Error('La fotografía supera los 20 megapíxeles.');
    }
    image = next;
    file = source;
    canvas.width = next.naturalWidth;
    canvas.height = next.naturalHeight;
    el('photo-label').textContent = title;
    select(region);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function example() {
  const request = ++imageVersion;
  const code = el('sample').value;
  const sample = info.examples[code];
  const response = await fetch('/assets/' + sample.file);
  if (!response.ok) throw new Error('No se pudo cargar el ejemplo.');
  await openImage(await response.blob(), 'Ejemplo de validación · ' + info.classes[code], sample.box, request);
}

el('sample').addEventListener('change', () => { if (info) example().catch(report); });
el('upload').addEventListener('change', event => {
  const selected = event.target.files[0];
  event.target.value = '';
  if (!selected) return;
  const request = ++imageVersion;
  if (selected.size > 8 * 1024 * 1024) {
    report(new Error('El archivo supera los 8 MB.'));
    return;
  }
  openImage(selected, selected.name, null, request).catch(report);
});

function node(tag, text, classes) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (classes) item.className = classes;
  return item;
}

function showPrediction(result) {
  el('prediction').textContent = info.classes[result.code] + ' · ' + percent(result.probabilities[result.code]);
  const rows = Object.entries(result.probabilities).filter(([code]) => code !== result.code).sort((a, b) => b[1] - a[1]).map(([code, p]) => {
    const row = node('div', undefined, 'probability');
    const bar = node('progress');
    bar.max = 1;
    bar.value = p;
    bar.setAttribute('aria-label', info.classes[code]);
    row.append(node('span', info.classes[code]), node('strong', percent(p)), bar);
    return row;
  });
  el('probabilities').replaceChildren(...rows);
  el('output').hidden = false;
}

el('classify').addEventListener('click', async () => {
  if (!box || !info || !file) return;
  const request = ++version;
  el('classify').disabled = true;
  el('status').textContent = 'Clasificando…';
  el('output').hidden = true;
  try {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: {'Content-Type': 'application/octet-stream', 'X-Region': box.join(',')},
      body: file,
    });
    const result = await response.json();
    if (request !== version) return;
    if (!response.ok) throw new Error(result.error);
    showPrediction(result);
    el('status').textContent = '';
  } catch (error) {
    if (request === version) report(error);
  } finally {
    if (request === version) el('classify').disabled = false;
  }
});

function evaluation() {
  el('validation-note').textContent = info.train.toLocaleString('es-PE') +
    ' recortes de entrenamiento y ' + info.validation.toLocaleString('es-PE') + ' de validación.';
  const metrics = [
    ['Acierto global', percent(info.accuracy)], ['F1 macro', info.macro_f1.toFixed(3)],
    ['Pérdida logarítmica', info.log_loss.toFixed(3)], ['Brier multiclase', info.brier.toFixed(3)],
  ];
  for (const [label, value] of metrics) {
    const card = node('div', undefined, 'card metric');
    card.append(node('strong', value), node('span', label));
    el('metrics').append(card);
  }
  const codes = Object.keys(info.classes);
  const table = node('table');
  table.createCaption().textContent = 'Filas de clase real y columnas de clase predicha.';
  table.createTHead().insertRow().append(node('th', 'Real / predicha'), ...codes.map(code => node('th', code)));
  const body = table.createTBody();
  info.matrix.forEach((row, i) => {
    body.insertRow().append(node('th', codes[i]), ...row.map(n => node('td', n)));
  });
  el('matrix').append(table);
}

async function init() {
  const response = await fetch('/assets/model-info.json');
  if (!response.ok) throw new Error('No se pudieron cargar los datos del modelo.');
  info = await response.json();
  evaluation();
  if (!imageVersion) await example();
}
init().catch(report);

