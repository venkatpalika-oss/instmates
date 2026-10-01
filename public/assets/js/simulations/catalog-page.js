import { CATEGORIES, SIMULATIONS } from './catalog.js';
const topicIcons = {
 'Pressure':'pressure','Flow':'flow','Level':'level','Temperature':'temperature',
 '4–20 mA':'current-loop','Transmitter scaling':'calibration','Control loops':'control-loop','PID fundamentals':'control-loop',
 'Oxygen analyzer':'oxygen-analyzer','Gas analyzer':'gas-analyzer','Gas chromatograph':'gas-chromatograph',
 'Moisture analyzer':'moisture-analyzer','Sample conditioning':'sample-conditioning',
 'Calibration exercises':'calibration','Fault diagnosis':'troubleshooting','Loop troubleshooting':'current-loop','Analyzer troubleshooting':'troubleshooting'
};
document.getElementById('lab-count').textContent=`${SIMULATIONS.length} working simulations`;
const list = document.getElementById('categories');
for (const category of CATEGORIES) {
  const section = document.createElement('section'); section.className = 'sim-panel category';
  section.id=category.name.toLowerCase().replaceAll(' & ','-').replaceAll(' ','-');
  const title = document.createElement('h2'); title.textContent = category.name; section.append(title);
  const topics = document.createElement('ul'); topics.className='sim-topic-list';
  for (const topic of category.topics) {
    const li=document.createElement('li'), img=document.createElement('img'), label=document.createElement('span'), status=document.createElement('small');
    img.src=`/assets/images/simulations/icon-${topicIcons[topic]}.svg`; img.alt=''; img.width=36; img.height=36;
    label.textContent=topic; const labs=SIMULATIONS.filter(s=>s.topics.includes(topic)); status.textContent=labs.length ? `AVAILABLE IN LAB ${labs.map(s=>s.lab).join(', ')}` : 'COMING SOON';
    label.append(status); li.append(img,label); topics.append(li);
  }
  section.append(topics);
  const entries = SIMULATIONS.filter(s => s.category === category.name);
  if (!entries.length) {
    const note = document.createElement('p'); note.className='availability'; const related=SIMULATIONS.filter(s=>s.topics.some(t=>category.topics.includes(t))); note.textContent=related.length ? `Available coverage: ${related.map(s=>`LAB ${s.lab} under ${s.category}`).join('; ')}.` : 'COMING SOON · no simulations published yet'; section.append(note);
  }
  for (const item of entries) {
    const link = document.createElement('a'); link.className='sim-card'; link.href=item.href;
    const name = document.createElement('h3'); name.textContent=item.title;
    const desc = document.createElement('p'); desc.textContent=item.description;
    const action = document.createElement('span'); action.className='sim-link'; action.textContent='Open simulator →';
    const badge=document.createElement('span'); badge.className='sim-badge'; badge.textContent=`AVAILABLE · LAB ${item.lab}`; link.append(badge,name,desc,action); section.append(link);
  }
  list.append(section);
}
