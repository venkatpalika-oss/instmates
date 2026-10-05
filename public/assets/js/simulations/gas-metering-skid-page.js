/** M1 presentation only. No process state, calculations, timing or faults. */
const controls = document.querySelector('.gm-equipment');
const buttons = [...controls.querySelectorAll('button[data-equipment]')];
const details = [...document.querySelectorAll('[data-detail]')];
const announcement = document.getElementById('gm-selected');
controls.hidden = false;
controls.addEventListener('click', event => {
  const button = event.target.closest('button[data-equipment]');
  if (!button || !controls.contains(button)) return;
  const detail = details.find(item => item.dataset.detail === button.dataset.equipment);
  if (!detail) return;
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  details.forEach(item => { item.hidden = item !== detail; });
  announcement.textContent = `Selected equipment: ${detail.querySelector('h3').textContent}`;
});
