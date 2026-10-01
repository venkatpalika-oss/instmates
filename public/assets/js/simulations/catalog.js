export const CATEGORIES = Object.freeze([
  { name:'Process measurement', topics:['Pressure','Flow','Level','Temperature'] },
  { name:'Signals & control', topics:['4–20 mA','Transmitter scaling','Control loops','PID fundamentals'] },
  { name:'Process analyzers', topics:['Oxygen analyzer','Gas analyzer','Gas chromatograph','Moisture analyzer','Sample conditioning'] },
  { name:'Calibration & troubleshooting', topics:['Calibration exercises','Fault diagnosis','Loop troubleshooting','Analyzer troubleshooting'] }
]);
export const SIMULATIONS = Object.freeze([
  { lab:'01', topics:['4–20 mA','Transmitter scaling'], id:'4-20ma-loop', category:'Signals & control', title:'4–20 mA transmitter & loop',
    href:'/simulations/4-20ma-loop/', description:'Follow a signal from process to display. Change ranges, inject faults and trace the evidence.',
    tags:['4–20 mA','Transmitter scaling','Fault diagnosis'] },
  { lab:'02', id:'pressure-transmitter-calibration', category:'Calibration & troubleshooting', topics:['Pressure','Calibration exercises'], title:'Pressure Transmitter Calibration', href:'/simulations/pressure-transmitter-calibration/', description:'Apply pressure, record nine observations, diagnose errors and compare as-found with as-left.', tags:['Pressure','Calibration'] }
]);
