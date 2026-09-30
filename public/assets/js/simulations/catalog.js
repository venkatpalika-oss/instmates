export const CATEGORIES = Object.freeze([
  { name:'Process measurement', topics:['Pressure','Flow','Level','Temperature'] },
  { name:'Signals & control', topics:['4–20 mA','Transmitter scaling','Control loops','PID fundamentals'] },
  { name:'Process analyzers', topics:['Oxygen analyzer','Gas analyzer','Gas chromatograph','Moisture analyzer','Sample conditioning'] },
  { name:'Calibration & troubleshooting', topics:['Calibration exercises','Fault diagnosis','Loop troubleshooting','Analyzer troubleshooting'] }
]);
export const SIMULATIONS = Object.freeze([
  { id:'4-20ma-loop', category:'Signals & control', title:'4–20 mA transmitter & loop',
    href:'/simulations/4-20ma-loop/', description:'Follow a signal from process to display. Change ranges, inject faults and trace the evidence.',
    tags:['4–20 mA','Transmitter scaling','Fault diagnosis'] }
]);
