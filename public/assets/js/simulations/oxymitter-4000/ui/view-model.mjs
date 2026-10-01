import {SOURCE_DATA as data} from '../source-data.mjs';
import {readSupported} from '../provenance.mjs';
export const read = datum => readSupported(datum,data.evidence);
export function source(id) {
 const e=data.evidence[id];
 if(!e) throw new RangeError('Unknown evidence');
 return `Manual ${data.manual.id} Rev ${data.manual.revision} · §${e.section} · PDF p${e.pages.join(', ')}${e.figureTable ? ' · '+e.figureTable : ''}`;
}
export function lookup(oxygen) {
 if(typeof oxygen!=='number'||!Number.isFinite(oxygen))throw new RangeError('Select a documented reference point');
 const p=data.referencePoints.find(p=>read(p.oxygenPercent)===oxygen);
 if(!p)throw new RangeError('Only exact documented reference points are available');
 return p;
}
// Original educational descriptions trace to approved M0 evidence, not geometry claims.
export const components = [
 ['process','Process / stack','The probe measures net oxygen in the process without a sampling system.','E01'],
 ['diffuser','Diffusion element','Passive element between process gas and the sensing cell.','E35'],
 ['cell','YSZ oxygen cell','Heated sensing cell produces a millivolt signal from the process/reference oxygen relationship.','E01'],
 ['reference','Reference air','Reference oxygen is on the opposite side of the sensing cell.','E03'],
 ['heater','Heater','Electronics controls the heater to maintain cell temperature. No temperature trajectory is simulated.','E36'],
 ['thermocouple','Thermocouple','Provides the heater thermocouple signal to the electronics.','E49'],
 ['tube','Probe tube / calibration passage','The probe assembly carries the sensing components; calibration gas has a separate passage to the cell.','E74'],
 ['electronics','Electronics','Accepts the cell millivolt signal and provides oxygen indication and isolated current output.','E36'],
 ['interface','Keypad or LOI','Alternative local interfaces for the transmitter. Changing this view does not change hardware.','E52'],
 ['loop','4–20 mA / HART','Analog output carries oxygen information; HART is superimposed on that same loop.','E60'],
 ['logic','Logic I/O','Separate two-terminal alarm or bidirectional calibration handshake contact.','E22'],
];
export function formatDatum(d) {
 if(d.status!=='SUPPORTED')return `Not simulated in this version. ${d.reason}`;
 const v=read(d);
 const format=v=>Array.isArray(v)?v.map(format).join(' / '):v&&typeof v==='object'?(('lower' in v)?`${v.lower}–${v.upper}`:('min' in v)?`${v.min}–${v.max}${v.balance?'; balance '+v.balance:''}`:JSON.stringify(v)):String(v);
 return `${format(v)} ${['text','state','signal','rule','number','unit'].includes(d.unit)?'':d.unit}`.trim();
}
