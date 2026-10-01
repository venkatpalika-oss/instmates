import { CATEGORIES, TOPICS, SIMULATIONS, availableLabs } from './catalog.js';

export function renderCatalog(root, labs=SIMULATIONS) {
 const doc=root.ownerDocument;
 const element=(tag,className,text)=>{const e=doc.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};
 const available=availableLabs(labs);
 root.replaceChildren();
 for(const lab of available) {
  const card=element('article','sim-card');
  const heading=element('h3','',lab.title); heading.id=`lab-${lab.id}`; card.setAttribute('aria-labelledby',heading.id);
  card.append(element('span','sim-badge',`LAB ${lab.lab} · AVAILABLE`),heading,element('p','catalog-outcome',lab.summary));
  const topics=element('ul','catalog-tags');topics.setAttribute('aria-label','Topics');
  for(const id of lab.topicIds.slice(0,3)) topics.append(element('li','',TOPICS[id]));
  const link=element('a','sim-button','Launch lab');link.href=lab.href;link.setAttribute('aria-label',`Launch lab: ${lab.title}`);
  card.append(topics,link);root.append(card);
 }
 if(!available.length) root.append(element('p','','No labs are available to launch yet.'));
 return available.length;
}
export function renderSubjects(root) {
 root.replaceChildren();
 for(const category of CATEGORIES) {
  const section=root.ownerDocument.createElement('section');section.className='category';
  const title=root.ownerDocument.createElement('h3');title.textContent=category.label;
  const text=root.ownerDocument.createElement('p');text.textContent=category.topicIds.map(id=>TOPICS[id]).join(' · ');
  section.append(title,text);root.append(section);
 }
}
if(typeof document!=='undefined' && document.getElementById('available-labs')) {
 const count=renderCatalog(document.getElementById('available-labs'));
 document.getElementById('lab-count').textContent=`${count} ${count===1?'lab':'labs'} available now`;
 renderSubjects(document.getElementById('categories'));
}
