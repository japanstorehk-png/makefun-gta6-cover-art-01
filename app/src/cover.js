// Afterglow Press — offline GTA-style cover renderer.
const PANEL_LAYOUTS = {
  solo: [[0.5, 0.5, 1, 1]],
  'split-vertical': [[0.25, 0.5, 0.5, 1], [0.75, 0.5, 0.5, 1]],
  'split-horizontal': [[0.5, 0.25, 1, 0.5], [0.5, 0.75, 1, 0.5]],
  triptych: [[0.167, 0.5, 0.333, 1], [0.5, 0.5, 0.333, 1], [0.833, 0.5, 0.333, 1]],
  grid: [[0.25, 0.25, 0.5, 0.5], [0.75, 0.25, 0.5, 0.5], [0.25, 0.75, 0.5, 0.5], [0.75, 0.75, 0.5, 0.5]],
  'hero-stack': [[0.5, 0.35, 1, 0.7], [0.25, 0.85, 0.5, 0.3], [0.75, 0.85, 0.5, 0.3]]
};

function layoutRects(layoutId, width, height) {
  const layout = PANEL_LAYOUTS[layoutId] || PANEL_LAYOUTS.solo;
  const rects = [];
  const gutter = 0.012;
  const margin = 0.02;
  for (const [x, y, w, h] of layout) {
    rects.push({
      x: (x - w / 2) * width + margin * width,
      y: (y - h / 2) * height + margin * height,
      width: w * width - 2 * margin * width - 2 * gutter * width,
      height: h * height - 2 * margin * height - 2 * gutter * height
    });
  }
  return rects;
}

function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { photos, panels, caption, captionPlace, layout } = state;
  const rects = layoutRects(layout, canvas.width, canvas.height);

  ctx.fillStyle = '#050308';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    const rect = rects[i];
    if (!panel || !rect || rect.width <= 0 || rect.height <= 0) continue;
    const img = photos && photos[panel.photoIndex];
    if (img) {
      const zoom = panel.zoom > 0 ? panel.zoom : 1;
      const scale = Math.max(rect.width / img.width, rect.height / img.height) * zoom;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rect.x + (rect.width - dw) / 2 + (panel.panX || 0) * (dw - rect.width) / 2;
      const dy = rect.y + (rect.height - dh) / 2 + (panel.panY || 0) * (dh - rect.height) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
      gradient.addColorStop(0, 'rgb(48, 24, 72)');
      gradient.addColorStop(1, 'rgb(12, 16, 36)');
      ctx.fillStyle = gradient;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.strokeStyle = 'rgba(255, 0, 180, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, Math.max(0, rect.width - 2), Math.max(0, rect.height - 2));
  }

  const grade = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grade.addColorStop(0, 'rgba(0, 150, 255, 0.10)');
  grade.addColorStop(0.66, 'rgba(255, 140, 0, 0.12)');
  grade.addColorStop(1, 'rgba(255, 0, 180, 0.16)');
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = Math.random() * 16 - 5;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(imageData, 0, 0);

  const lightLeak = ctx.createLinearGradient(0, 0, canvas.width, canvas.height * 0.4);
  lightLeak.addColorStop(0, 'rgba(255, 190, 90, 0.16)');
  lightLeak.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = lightLeak;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tealLeak = ctx.createLinearGradient(canvas.width, canvas.height, canvas.width * 0.4, canvas.height * 0.6);
  tealLeak.addColorStop(0, 'rgba(0, 200, 255, 0.14)');
  tealLeak.addColorStop(1, 'rgba(0, 200, 255, 0)');
  ctx.fillStyle = tealLeak;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 210, 80, 0.55)';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.86, canvas.height * 0.18, Math.max(24, canvas.width * 0.045), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(6, 10, 16, 0.72)';
  const palmBaseX = canvas.width * 0.12;
  const palmBaseY = canvas.height * 0.92;
  ctx.beginPath();
  ctx.moveTo(palmBaseX, palmBaseY);
  ctx.lineTo(palmBaseX + canvas.width * 0.02, palmBaseY - canvas.height * 0.28);
  ctx.lineTo(palmBaseX + canvas.width * 0.035, palmBaseY);
  ctx.closePath();
  ctx.fill();
  for (let p = -2; p <= 2; p++) {
    ctx.beginPath();
    ctx.moveTo(palmBaseX + canvas.width * 0.025, palmBaseY - canvas.height * 0.26);
    ctx.quadraticCurveTo(
      palmBaseX + p * canvas.width * 0.05,
      palmBaseY - canvas.height * 0.34,
      palmBaseX + p * canvas.width * 0.08,
      palmBaseY - canvas.height * 0.22
    );
    ctx.lineWidth = Math.max(3, canvas.width * 0.004);
    ctx.strokeStyle = 'rgba(6, 10, 16, 0.72)';
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0, 40, 60, 0.28)';
  ctx.fillRect(0, canvas.height * 0.93, canvas.width, canvas.height * 0.07);

  const text = String(caption || '').trim() || 'PALM HOUR';
  const size = Math.max(64, Math.round(canvas.height * 0.09));
  ctx.font = '700 ' + size + 'px "Press Display", Anton, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(6, Math.round(size / 8));
  ctx.strokeStyle = '#12010a';
  ctx.fillStyle = '#fff3c4';
  const words = text.split(/\s+/).filter(Boolean);
  const place = captionPlace || 'footer';
  if (place === 'stacked') {
    const lineH = size * 1.05;
    const startY = canvas.height / 2 - ((words.length - 1) * lineH) / 2;
    for (let i = 0; i < words.length; i++) {
      const y = startY + i * lineH;
      ctx.strokeText(words[i], canvas.width / 2, y);
      ctx.fillText(words[i], canvas.width / 2, y);
    }
  } else if (place === 'top-bar') {
    ctx.strokeText(text, canvas.width / 2, size * 0.8);
    ctx.fillText(text, canvas.width / 2, size * 0.8);
  } else {
    const y = canvas.height - size * 0.7;
    ctx.strokeText(text, canvas.width / 2, y);
    ctx.fillText(text, canvas.width / 2, y);
  }
}

export { PANEL_LAYOUTS, layoutRects, drawCover };