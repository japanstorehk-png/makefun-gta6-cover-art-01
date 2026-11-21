export async function runShot(shot, query, applyScene) {
  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'PALM HOUR';
  let layout;

  switch (shot) {
    case 'cover':
    case 'portrait':
    case 'wide':
      document.body.classList.add('shot-cover');
      break;
    case 'editor':
      // Leave chrome visible
      break;
    default:
      // Default layout for other shots
      break;
  }

  if (shot === 'cover') {
    layout = 'triptych';
  } else if (shot === 'portrait') {
    layout = 'hero-stack';
  } else if (shot === 'wide') {
    layout = 'split-horizontal';
  } else if (shot === 'editor') {
    layout = 'triptych';
  } else {
    // Default layout for other shots
    layout = 'default';
  }

  const captionPlace = shot === 'portrait' ? 'stacked' : 'default';

  await applyScene({
    photo,
    caption,
    layout,
    captionPlace,
    // Optionally add a second sample if needed
    // secondSample: 'second-sample.jpg'
  });

  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.__shotReady = true;
        resolve();
      });
    });
  });
}