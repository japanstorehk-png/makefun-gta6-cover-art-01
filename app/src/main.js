import { drawCover, layoutRects, PANEL_LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const LAYOUT_COUNTS = {
  solo: 1,
  'split-vertical': 2,
  'split-horizontal': 2,
  triptych: 3,
  grid: 4,
  'hero-stack': 3
};

function emptyPanel() {
  return { photoIndex: -1, zoom: 1, panX: 0, panY: 0 };
}

const state = {
  photos: [],
  panels: [emptyPanel()],
  caption: 'PALM HOUR',
  captionPlace: 'footer',
  layout: 'triptych',
  selectedPanel: 0,
  editorWidth: 1080,
  editorHeight: 1080
};

const canvas = document.getElementById('cover-canvas');
const statusEl = document.getElementById('status');
const sizeLabel = document.getElementById('size-label');
const captionInput = document.getElementById('caption-input');
const captionPlace = document.getElementById('caption-place');
const layoutSelect = document.getElementById('layout-select');

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function renderPanelPicker() {
  const box = document.getElementById('panel-picker');
  if (!box) return;
  box.innerHTML = '';
  const sel = document.createElement('select');
  state.panels.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = 'Panel ' + (i + 1);
    if (i === state.selectedPanel) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    state.selectedPanel = parseInt(sel.value, 10) || 0;
    syncSliders();
  });
  box.appendChild(sel);
}

function resizePanels() {
  const n = (PANEL_LAYOUTS[state.layout] || []).length || LAYOUT_COUNTS[state.layout] || 1;
  const next = [];
  for (let i = 0; i < n; i++) next.push(state.panels[i] || emptyPanel());
  state.panels = next;
  if (state.selectedPanel >= n) state.selectedPanel = 0;
  renderPanelPicker();
}

function redraw() {
  canvas.width = state.editorWidth;
  canvas.height = state.editorHeight;
  drawCover(canvas, state);
  if (sizeLabel) sizeLabel.textContent = canvas.width + 'x' + canvas.height;
}

function syncSliders() {
  const p = state.panels[state.selectedPanel] || emptyPanel();
  const z = document.getElementById('panel-zoom');
  const x = document.getElementById('panel-pan-x');
  const y = document.getElementById('panel-pan-y');
  if (z) { z.min = 1; z.max = 3; z.step = 0.01; z.value = p.zoom; }
  if (x) { x.min = -1; x.max = 1; x.step = 0.01; x.value = p.panX; }
  if (y) { y.min = -1; y.max = 1; y.step = 0.01; y.value = p.panY; }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

document.getElementById('photo-input').addEventListener('change', (event) => {
  const files = event.target.files || [];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    loadImage(url).then((image) => {
      state.photos.push(image);
      const idx = state.photos.length - 1;
      const unused = state.panels.find((p) => p.photoIndex < 0 || !state.photos[p.photoIndex]);
      if (unused) unused.photoIndex = idx;
      else if (state.panels[state.selectedPanel]) state.panels[state.selectedPanel].photoIndex = idx;
      setStatus(state.photos.length + ' photo(s) loaded.');
      redraw();
    });
  }
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});

captionPlace.addEventListener('change', () => {
  state.captionPlace = captionPlace.value;
  redraw();
});

layoutSelect.value = state.layout;
layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  resizePanels();
  redraw();
});

function bindSlider(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.min = key === 'zoom' ? 1 : -1;
  el.max = key === 'zoom' ? 3 : 1;
  el.step = '0.01';
  el.addEventListener('input', () => {
    const p = state.panels[state.selectedPanel];
    if (!p) return;
    p[key] = parseFloat(el.value);
    redraw();
  });
}
bindSlider('panel-zoom', 'zoom');
bindSlider('panel-pan-x', 'panX');
bindSlider('panel-pan-y', 'panY');

function exportPng(width, height) {
  const prevW = canvas.width;
  const prevH = canvas.height;
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  canvas.toBlob((blob) => {
    const name = 'afterglow-' + width + 'x' + height + '.png';
    const link = document.createElement('a');
    link.download = name;
    link.href = URL.createObjectURL(blob);
    link.click();
    canvas.width = prevW;
    canvas.height = prevH;
    drawCover(canvas, state);
    setStatus('Saved ' + name);
  }, 'image/png');
}

document.getElementById('export-square').addEventListener('click', () => exportPng(1080, 1080));
document.getElementById('export-portrait').addEventListener('click', () => exportPng(1080, 1350));
document.getElementById('export-wide').addEventListener('click', () => exportPng(1920, 1080));

resizePanels();
syncSliders();

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('shot')) {
  const shot = urlParams.get('shot');
  runShot(shot, urlParams, async (scene) => {
    const name = scene.photo || 'pier';
    const image = await loadImage('./samples/' + name + '.jpg');
    state.photos = [image];
    state.caption = scene.caption || 'PALM HOUR';
    state.layout = scene.layout && scene.layout !== 'default' ? scene.layout : 'triptych';
    state.captionPlace = scene.captionPlace && scene.captionPlace !== 'default' ? scene.captionPlace : 'footer';
    layoutSelect.value = state.layout;
    captionInput.value = state.caption;
    captionPlace.value = state.captionPlace;
    resizePanels();
    for (const p of state.panels) p.photoIndex = 0;
    if (shot === 'portrait') {
      state.editorWidth = 1080;
      state.editorHeight = 1350;
    } else if (shot === 'wide') {
      state.editorWidth = 1920;
      state.editorHeight = 1080;
    } else {
      state.editorWidth = 1080;
      state.editorHeight = 1080;
    }
    redraw();
  });
} else {
  redraw();
}