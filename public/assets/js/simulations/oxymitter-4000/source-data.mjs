// Sole source: attached manual and approved M0. Reference data, not a continuous model.
import { deepFreeze, validateFixtureTree } from "./provenance.mjs";
const data = {
  "manual": {
    "id": "00809-0100-4340",
    "revision": "AE",
    "date": "November 2024",
    "pdfPages": 186,
    "sha256": "10797192d9fabc4dba8e966a71e69f300f2ceb64c71f98a0f74444bdc17de3ee"
  },
  "m0Baseline": {
    "package": "Oxymitter_4000_M0_Specification.zip",
    "sha256": "0669475126965a7f0a1b9ee36c37a2d6c793ee07ea3c44cbae18b2e9acf09bfe",
    "files": {
      "00-READ-ME.txt": "833cbc03a6043d2d0900ac31be87626bf6c654e50ce79b244b1362df2782b028",
      "01-source-evidence-matrix.json": "9d9923498474649d41e806a6e3becf1717676ccb64fc189bc9d2cebee4dbf9fd",
      "01-source-evidence-matrix.txt": "245a63eb9d78a0dc52a3f70122419733071bcd142d36ad543406201ed4e5240a",
      "02-simulator-technical-specification.txt": "d1e0fda7d041f58080cb927ae789f61cbd9f185853fd7261a2ae494dfbb054b1",
      "03-measurement-model-specification.txt": "d0e6c05c56f291a693cd64ad4af8a912e6e348fc33c70ed29cf320a5e0baf59e",
      "04-startup-state-machine.txt": "8b2f5fbef945879f14e832d45cf38fd3d05da701923ea5b779152897626b2356",
      "05-calibration-state-machine.txt": "48e821591467a631e637983922d53e5971b2416e0fec1fbcbd1458f790f0006d",
      "06-diagnostic-fault-matrix.json": "5eb4f4201880485324527997d09a60125dd86acb1782ab2bd0a9a5eb1230ed87",
      "06-diagnostic-fault-matrix.txt": "c8c7c80621f22366f13bad76b87530c2cdbd229e2ad35eebe2452a8704b213a3",
      "07-troubleshooting-scenario-matrix.json": "0aa27f016b876dcbeabf0a2d9695fa3e6f0d497488d8268b002a7524178ba761",
      "07-troubleshooting-scenario-matrix.txt": "4c0f6723f008d38ac4b49a4e419a6a1c5c9d3e104a4a22119acce4b01ddc6088",
      "08-loi-keypad-interaction-specification.txt": "dfba2d3b77d537cb6eb04d6dbe3847ff7b33dea27773848e51fd5b4999180e27",
      "09-test-point-specification.txt": "13ada4a1230c094560ccc32eb77c13978cc023208ddc92109a77b6c0f8513da2",
      "10-proposed-ui-architecture.txt": "1d118a6d3795450a88aa32c9454c1fb0751e9928517cde917acbbb3773b47d70",
      "11-instmates-integration-plan.txt": "f24c570cd54820f55e7a6762dfc8a4b56d67b57dc4c67de175a6379badf2fbf1",
      "12-implementation-milestone-plan.txt": "09db95072e2f93e0cf9f6d0ddc6101d700e3cef7ee90bdb6a08072eab2525934",
      "13-source-gap-owner-decision-register.json": "ca70fdd02f90b168ff73665f50dec9045f80510c0f78cc525046c353b1d46fa5",
      "13-source-gap-owner-decision-register.txt": "7f3b7443387ee79d9594b8f35681e041e9b321441bc835f951fcd42d8083bbbe",
      "calibration-state-machine.json": "570546a1d3a5fc46c74ecb027d2c7ff17014fe49d04b3dc1686e2c7f17cb0bf6",
      "loi-menu-hierarchy.json": "44608927917ba2133172f87ee2fa534720f5d59b51e9c432bb210f5e7c3c54f9",
      "measurement-reference.json": "6ee0669941ff6cd7b0eff347858938f94fd75d5156ac73125401d8539296c8ae",
      "startup-state-machine.json": "91d82c69c683d6c60abd3c826a5d3a0bacf280b8e5035553ef449247f6256340"
    }
  },
  "evidence": {
    "E01": {
      "section": "1.3",
      "pages": [
        17
      ],
      "figureTable": "",
      "description": "Measurement"
    },
    "E02": {
      "section": "1.3",
      "pages": [
        17
      ],
      "figureTable": "",
      "description": "P1 reference O2 partial pressure; P2 measured-gas O2 partial pressure; T absolute temperature; C cell constant; K arithmetic constant. Numerical K is not given."
    },
    "E03": {
      "section": "1.3",
      "pages": [
        17
      ],
      "figureTable": "",
      "description": "Reference composition"
    },
    "E04": {
      "section": "1.3",
      "pages": [
        17
      ],
      "figureTable": "",
      "description": "Sensitivity"
    },
    "E05": {
      "section": "8.1",
      "pages": [
        107
      ],
      "figureTable": "Fig 8-1",
      "description": "Cell setpoint"
    },
    "E06": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "O2 range"
    },
    "E07": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Process temperature"
    },
    "E08": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Electronics housing"
    },
    "E09": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Electronics package/internal"
    },
    "E10": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "LOI limits"
    },
    "E11": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Oxidizing accuracy"
    },
    "E12": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Lowest detectable O2"
    },
    "E13": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Calibration response"
    },
    "E14": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Calibration repeatability"
    },
    "E15": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Reducing accuracy"
    },
    "E16": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Reducing response"
    },
    "E17": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Low calibration gas"
    },
    "E18": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "High calibration gas"
    },
    "E19": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Calibration gas supply"
    },
    "E20": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Reference air specification"
    },
    "E21": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Output"
    },
    "E22": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Logic contact"
    },
    "E23": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Consumption"
    },
    "E24": {
      "section": "1.7.1",
      "pages": [
        32
      ],
      "figureTable": "",
      "description": "Repeatability temperature effect"
    },
    "E25": {
      "section": "1.7.2",
      "pages": [
        33
      ],
      "figureTable": "",
      "description": "Electrical specification variants"
    },
    "E26": {
      "section": "1.4",
      "pages": [
        18,
        52,
        55
      ],
      "figureTable": "Figs 2-13 to 2-16",
      "description": "Core AC supply"
    },
    "E27": {
      "section": "1.7.2",
      "pages": [
        34
      ],
      "figureTable": "Fig 1-16",
      "description": "Graphical external loop envelope"
    },
    "E28": {
      "section": "2.4.1",
      "pages": [
        61,
        62
      ],
      "figureTable": "Fig 2-18, Table 2-10",
      "description": "Pneumatic reference air"
    },
    "E29": {
      "section": "5.1.5",
      "pages": [
        81,
        89
      ],
      "figureTable": "",
      "description": "Startup reference air"
    },
    "E30": {
      "section": "2.4.2",
      "pages": [
        62
      ],
      "figureTable": "Fig 2-19",
      "description": "Gas safety"
    },
    "E31": {
      "section": "2.4.2",
      "pages": [
        62,
        92,
        143
      ],
      "figureTable": "",
      "description": "Typical gases"
    },
    "E32": {
      "section": "2.1.1",
      "pages": [
        37,
        38,
        46
      ],
      "figureTable": "Figs 2-1 to 2-11",
      "description": "Installation"
    },
    "E33": {
      "section": "2",
      "pages": [
        37,
        180,
        181
      ],
      "figureTable": "Appendix D.5",
      "description": "Variant hazardous-area limits"
    },
    "E34": {
      "section": "D.5",
      "pages": [
        180,
        181
      ],
      "figureTable": "",
      "description": "Hazardous calibration lines"
    },
    "E35": {
      "section": "1.6",
      "pages": [
        30,
        31,
        45,
        46,
        139
      ],
      "figureTable": "Figs 1-13 to 1-15; 2-9",
      "description": "Diffusion and shield"
    },
    "E36": {
      "section": "1.4",
      "pages": [
        18,
        23,
        26,
        50,
        56
      ],
      "figureTable": "Figs 1-6, 1-9, 2-12, 2-16",
      "description": "Signal chain"
    },
    "E37": {
      "section": "3.4.1",
      "pages": [
        67,
        68,
        73,
        74
      ],
      "figureTable": "Figs 3-2, 4-2",
      "description": "SW1"
    },
    "E38": {
      "section": "3.4.2",
      "pages": [
        67,
        68,
        74
      ],
      "figureTable": "Fig 3-2",
      "description": "SW2 position 1"
    },
    "E39": {
      "section": "3.4.2",
      "pages": [
        67,
        68,
        74
      ],
      "figureTable": "Fig 3-2",
      "description": "SW2 position 2"
    },
    "E40": {
      "section": "3.4.2",
      "pages": [
        67,
        68,
        75
      ],
      "figureTable": "Fig 3-2",
      "description": "SW2 position 3"
    },
    "E41": {
      "section": "3.4.2",
      "pages": [
        67,
        68,
        75
      ],
      "figureTable": "Fig 3-2",
      "description": "SW2 position 4"
    },
    "E42": {
      "section": "3.4",
      "pages": [
        68,
        74
      ],
      "figureTable": "",
      "description": "Changing switch defaults"
    },
    "E43": {
      "section": "3.6.2",
      "pages": [
        70,
        77,
        110
      ],
      "figureTable": "",
      "description": "Calibration output"
    },
    "E44": {
      "section": "5.1.1",
      "pages": [
        79,
        85
      ],
      "figureTable": "Figs 5-1, 6-1",
      "description": "Startup"
    },
    "E45": {
      "section": "5.1.1",
      "pages": [
        79
      ],
      "figureTable": "Fig 5-1",
      "description": "Warmup keypad"
    },
    "E46": {
      "section": "5.1.2",
      "pages": [
        79,
        81
      ],
      "figureTable": "Figs 5-1, 5-3",
      "description": "Normal keypad"
    },
    "E47": {
      "section": "5.2.1",
      "pages": [
        81,
        109
      ],
      "figureTable": "Fig 8-2",
      "description": "Keypad alarms"
    },
    "E48": {
      "section": "5.2.2",
      "pages": [
        53,
        82,
        101
      ],
      "figureTable": "Table 2-8 footnote",
      "description": "Calibration recommended"
    },
    "E49": {
      "section": "5.2.3",
      "pages": [
        67,
        82,
        95
      ],
      "figureTable": "Figs 3-2, 5-4, 6-8",
      "description": "TP pair roles"
    },
    "E50": {
      "section": "5.2.4",
      "pages": [
        75,
        82,
        83
      ],
      "figureTable": "",
      "description": "TP5/6 examples"
    },
    "E51": {
      "section": "5.2.4",
      "pages": [
        82,
        83
      ],
      "figureTable": "",
      "description": "Keypad gas adjustment"
    },
    "E52": {
      "section": "6.1",
      "pages": [
        85,
        86
      ],
      "figureTable": "Figs 6-1, 6-2",
      "description": "LOI startup"
    },
    "E53": {
      "section": "6.2.2",
      "pages": [
        90
      ],
      "figureTable": "",
      "description": "LOI lock"
    },
    "E54": {
      "section": "6.3",
      "pages": [
        90
      ],
      "figureTable": "",
      "description": "LOI keys"
    },
    "E55": {
      "section": "6.4",
      "pages": [
        87,
        88,
        91,
        92
      ],
      "figureTable": "Figs 6-3, 6-5, 6-6",
      "description": "LOI tree"
    },
    "E56": {
      "section": "6.5",
      "pages": [
        92
      ],
      "figureTable": "",
      "description": "Gas order"
    },
    "E57": {
      "section": "6.5",
      "pages": [
        93,
        94
      ],
      "figureTable": "",
      "description": "LOI setup defaults"
    },
    "E58": {
      "section": "6.5",
      "pages": [
        93
      ],
      "figureTable": "Fig 6-6",
      "description": "Output direction"
    },
    "E59": {
      "section": "6.7",
      "pages": [
        92,
        94
      ],
      "figureTable": "Fig 6-6",
      "description": "Reset device"
    },
    "E60": {
      "section": "7.1",
      "pages": [
        20,
        97,
        98,
        99
      ],
      "figureTable": "Figs 7-1, 7-2",
      "description": "HART"
    },
    "E61": {
      "section": "7.5",
      "pages": [
        53,
        54,
        100,
        101
      ],
      "figureTable": "Tables 2-9, 7-1",
      "description": "Logic modes"
    },
    "E62": {
      "section": "7.7",
      "pages": [
        104,
        105
      ],
      "figureTable": "Fig 7-3",
      "description": "HART calibration status"
    },
    "E63": {
      "section": "7.8",
      "pages": [
        106
      ],
      "figureTable": "",
      "description": "HART scheduled calibration"
    },
    "E64": {
      "section": "7.9",
      "pages": [
        106
      ],
      "figureTable": "",
      "description": "D/A trim"
    },
    "E65": {
      "section": "8.1",
      "pages": [
        107,
        108
      ],
      "figureTable": "Fig 8-1; Table 8-1 mislabeled Logic I/O",
      "description": "EMF validation table"
    },
    "E66": {
      "section": "8.5",
      "pages": [
        53,
        111
      ],
      "figureTable": "Tables 2-8, 8-2",
      "description": "Diagnostic output/self-clear"
    },
    "E67": {
      "section": "9.2.2",
      "pages": [
        143
      ],
      "figureTable": "Fig 9-1",
      "description": "Calibration setup"
    },
    "E68": {
      "section": "9.2.2",
      "pages": [
        143,
        147
      ],
      "figureTable": "",
      "description": "Abort"
    },
    "E69": {
      "section": "9.2.2",
      "pages": [
        145,
        146,
        147,
        148
      ],
      "figureTable": "Fig 9-2",
      "description": "Manual calibration"
    },
    "E70": {
      "section": "8.5.13",
      "pages": [
        131,
        132,
        133,
        134,
        135,
        136,
        147,
        148
      ],
      "figureTable": "Figs 8-23 to 8-28",
      "description": "Calibration validity"
    },
    "E71": {
      "section": "9.2.3",
      "pages": [
        147,
        148
      ],
      "figureTable": "",
      "description": "LOI calibration"
    },
    "E72": {
      "section": "9.2.2",
      "pages": [
        144,
        145
      ],
      "figureTable": "",
      "description": "Autocal variants"
    },
    "E73": {
      "section": "9.3",
      "pages": [
        141,
        148,
        149,
        153,
        155,
        157,
        177
      ],
      "figureTable": "",
      "description": "Maintenance safety"
    },
    "E74": {
      "section": "9.3.9",
      "pages": [
        139,
        149,
        157,
        160
      ],
      "figureTable": "Figs 9-7, 9-8",
      "description": "Maintenance follow-up"
    },
    "E75": {
      "section": "9.3.10",
      "pages": [
        161,
        162
      ],
      "figureTable": "Fig 9-8",
      "description": "Diffuser maintenance"
    },
    "F01": {
      "section": "8.5.1",
      "pages": [
        111,
        112,
        113
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Open thermocouple"
    },
    "F02": {
      "section": "8.5.2",
      "pages": [
        113,
        114
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Shorted thermocouple"
    },
    "F03": {
      "section": "8.5.3",
      "pages": [
        115,
        116
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Reversed T/C wiring or faulty board"
    },
    "F04": {
      "section": "8.5.4",
      "pages": [
        116,
        117,
        118
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "A/D communications error"
    },
    "F05": {
      "section": "8.5.5",
      "pages": [
        118,
        119,
        120
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Open heater"
    },
    "F06": {
      "section": "8.5.6",
      "pages": [
        120,
        121,
        122
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "High high heater temperature"
    },
    "F07": {
      "section": "8.5.7",
      "pages": [
        122,
        123,
        124
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "High case temperature"
    },
    "F08": {
      "section": "8.5.8",
      "pages": [
        125,
        126
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Low heater temperature"
    },
    "F09": {
      "section": "8.5.9",
      "pages": [
        126,
        127
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "High heater temperature"
    },
    "F10": {
      "section": "8.5.10",
      "pages": [
        127,
        128
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "High cell mV"
    },
    "F11": {
      "section": "8.5.11",
      "pages": [
        128,
        129
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Bad cell"
    },
    "F12": {
      "section": "8.5.12",
      "pages": [
        129,
        130,
        131
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "EEprom corrupt"
    },
    "F13": {
      "section": "8.5.13",
      "pages": [
        131,
        132,
        133
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Invalid slope"
    },
    "F14": {
      "section": "8.5.14",
      "pages": [
        133,
        134,
        135
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Invalid constant"
    },
    "F15": {
      "section": "8.5.15",
      "pages": [
        135,
        136,
        137
      ],
      "figureTable": "2-8 p53;8-2 p111",
      "description": "Last calibration failed"
    },
    "F16": {
      "section": "8.5",
      "pages": [
        111
      ],
      "figureTable": "8-2",
      "description": "Incorrect line frequency detected on power up"
    },
    "F17": {
      "section": "2.2.1;5.2.2;7.5",
      "pages": [
        53,
        82,
        101
      ],
      "figureTable": "2-8 footnote",
      "description": "Calibration Recommended / High AC Impedance"
    }
  },
  "referencePoints": [
    {
      "oxygenPercent": {
        "value": 100,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": -34,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 20,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 1,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 15,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 7.25,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 10,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 16.1,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 9,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 18.4,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 8,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 21.1,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 7,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 23.8,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 6,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 27.2,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 5,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 31.2,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 4,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 36,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 3,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 42.3,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 2,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 51.1,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 1,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 66.1,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.8,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 71,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.6,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 77.5,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.5,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 81.5,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.4,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 86.3,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.2,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 101.4,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.1,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 116.6,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "oxygenPercent": {
        "value": 0.01,
        "unit": "% O2",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      },
      "emfMv": {
        "value": 166.8,
        "unit": "mV",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E65"
        }
      }
    }
  ],
  "operating": {
    "cellSetpoint": {
      "value": 736,
      "unit": "deg C",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E05"
      }
    },
    "referenceOxygen": {
      "value": 20.95,
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E03"
      }
    },
    "warmupApproximate": {
      "value": 30,
      "unit": "minute",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E44"
      }
    },
    "localRanges": {
      "value": [
        {
          "lower": 0,
          "upper": 10
        },
        {
          "lower": 0,
          "upper": 25
        }
      ],
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E39"
      }
    },
    "factoryRange": {
      "value": {
        "lower": 0,
        "upper": 10
      },
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E39"
      }
    },
    "hartRangeDescription": {
      "value": "Variable 0-10% to 0-40%",
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E06"
      }
    },
    "housingTemperature": {
      "value": {
        "min": -40,
        "max": 70
      },
      "unit": "deg C",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E08"
      }
    },
    "internalTemperature": {
      "value": {
        "min": -40,
        "max": 85
      },
      "unit": "deg C",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E09"
      }
    },
    "lowestDetectable": {
      "value": 0.02,
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E12"
      }
    },
    "startupOutputChoices": {
      "value": [
        3.5,
        21.6
      ],
      "unit": "mA",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E40"
      }
    },
    "startupOutputDefault": {
      "value": 3.5,
      "unit": "mA",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E40"
      }
    },
    "calibrationOutputDefault": {
      "value": "TRACK",
      "unit": "state",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E43"
      }
    },
    "calibrationOutputChoices": {
      "value": [
        "TRACK",
        "HOLD"
      ],
      "unit": "state",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E43"
      }
    }
  },
  "calibration": {
    "lowGas": {
      "value": {
        "min": 0.4,
        "max": 2,
        "balance": "nitrogen"
      },
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E17"
      }
    },
    "highGas": {
      "value": {
        "min": 8,
        "max": 21,
        "balance": "nitrogen"
      },
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E18"
      }
    },
    "typicalGases": {
      "value": [
        0.4,
        8
      ],
      "unit": "% O2",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E31"
      }
    },
    "gasFlowTime": {
      "value": 300,
      "unit": "second",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E57"
      }
    },
    "purgeTime": {
      "value": 3,
      "unit": "minute",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E69"
      }
    },
    "gasApplicationWait": {
      "value": 30,
      "unit": "minute",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E69"
      }
    },
    "slopeLimits": {
      "value": {
        "min": 35,
        "max": 52
      },
      "unit": "mV/dec",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E70"
      }
    },
    "constantLimits": {
      "value": {
        "min": -4,
        "max": 10
      },
      "unit": "mV",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E70"
      }
    },
    "gasOrder": {
      "value": "Gas 1 may be high or low; order is not important",
      "unit": "state",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E56"
      }
    },
    "flowSettingRule": {
      "value": "Reset 5 SCFH only with a new diffuser",
      "unit": "rule",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E67"
      }
    }
  },
  "faults": [
    {
      "id": "fault-1",
      "number": {
        "value": 1,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "alarm": {
        "value": "Open thermocouple",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "loiMessage": {
        "value": "O2 T/C Open",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "diagnosticLed": {
        "value": "HEATER T/C",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "blinkCount": {
        "value": 1,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F01"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F01"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-2",
      "number": {
        "value": 2,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "alarm": {
        "value": "Shorted thermocouple",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "loiMessage": {
        "value": "O2 T/C Shorted",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "diagnosticLed": {
        "value": "HEATER T/C",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "blinkCount": {
        "value": 2,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "pause": {
        "value": 2,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F02"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F02"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-3",
      "number": {
        "value": 3,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "alarm": {
        "value": "Reversed T/C wiring or faulty board",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "loiMessage": {
        "value": "O2 T/C Reversed",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "diagnosticLed": {
        "value": "HEATER T/C",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "blinkCount": {
        "value": 3,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "triggerDescription": {
        "value": "Negative TP3/4 supports reversed wiring; no precise alarm trigger given",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F03"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-4",
      "number": {
        "value": 4,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "alarm": {
        "value": "A/D communications error",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "loiMessage": {
        "value": "ADC Error",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "diagnosticLed": {
        "value": "HEATER T/C",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "blinkCount": {
        "value": 4,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F04"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F04"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-5",
      "number": {
        "value": 5,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "alarm": {
        "value": "Open heater",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "loiMessage": {
        "value": "O2 Heater Open",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "diagnosticLed": {
        "value": "HEATER",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "blinkCount": {
        "value": 1,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F05"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F05"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-6",
      "number": {
        "value": 6,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "alarm": {
        "value": "High high heater temperature",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "loiMessage": {
        "value": "Very Hi O2 Temp",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "diagnosticLed": {
        "value": "HEATER",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "blinkCount": {
        "value": 2,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "triggerDescription": {
        "value": "T/C 37.1mV (900degC)",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F06"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-7",
      "number": {
        "value": 7,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "alarm": {
        "value": "High case temperature",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "loiMessage": {
        "value": "Board Temp Hi",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "diagnosticLed": {
        "value": "HEATER",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "blinkCount": {
        "value": 3,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "triggerDescription": {
        "value": "Case >85degC",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F07"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-8",
      "number": {
        "value": 8,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "alarm": {
        "value": "Low heater temperature",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "loiMessage": {
        "value": "O2 Temp Low",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "diagnosticLed": {
        "value": "HEATER",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "blinkCount": {
        "value": 4,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "triggerDescription": {
        "value": "T/C dropped below28.6mV; downward1min without returning to ~29.3mV leads Open Heater",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F08"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-9",
      "number": {
        "value": 9,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "alarm": {
        "value": "High heater temperature",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "loiMessage": {
        "value": "O2 Temp Hi",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "diagnosticLed": {
        "value": "HEATER",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "blinkCount": {
        "value": 5,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "triggerDescription": {
        "value": "T/C >approximately30.7mV",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F09"
        }
      },
      "outputBehavior": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G06",
        "reason": "Table2-8 p53 specifies SW2.3 (3.5/21.6mA); section8.5.9 p126 says4/20mA. No precedence selected.",
        "source": {
          "evidenceId": "F09"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-10",
      "number": {
        "value": 10,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "alarm": {
        "value": "High cell mV",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "loiMessage": {
        "value": "O2 Cell Open",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "diagnosticLed": {
        "value": "O2 CELL",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "blinkCount": {
        "value": 1,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F10"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F10"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-11",
      "number": {
        "value": 11,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "alarm": {
        "value": "Bad cell",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "loiMessage": {
        "value": "O2 Cell Bad",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "diagnosticLed": {
        "value": "O2 CELL",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "blinkCount": {
        "value": 3,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "triggerDescription": {
        "value": "Cell exceeds maximum resistance; numerical maximum not given",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "outputBehavior": {
        "value": "Track O2",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F11"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-12",
      "number": {
        "value": 12,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "alarm": {
        "value": "EEprom corrupt",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "loiMessage": {
        "value": "EEprom Corrupt",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "diagnosticLed": {
        "value": "O2 CELL",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "blinkCount": {
        "value": 4,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "triggerDescription": {
        "value": "Changed EEprom does not update at powerup; running occurrence points to hardware",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "outputBehavior": {
        "value": "SW2.3:3.5mA or21.6mA",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F12"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-13",
      "number": {
        "value": 13,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "alarm": {
        "value": "Invalid slope",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "loiMessage": {
        "value": "O2 Cell Bad",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "diagnosticLed": {
        "value": "CALIBRATION",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "blinkCount": {
        "value": 1,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "triggerDescription": {
        "value": "Slope <35 or >52mV/dec",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "outputBehavior": {
        "value": "Track O2",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F13"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-14",
      "number": {
        "value": 14,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "alarm": {
        "value": "Invalid constant",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "loiMessage": {
        "value": "O2 Cell Bad",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "diagnosticLed": {
        "value": "CALIBRATION",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "blinkCount": {
        "value": 2,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "triggerDescription": {
        "value": "Constant outside -4 to10mV",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "outputBehavior": {
        "value": "Track O2",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F14"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "fault-15",
      "number": {
        "value": 15,
        "unit": "number",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "alarm": {
        "value": "Last calibration failed",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "loiMessage": {
        "value": "Calib Failed",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "diagnosticLed": {
        "value": "CALIBRATION",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "blinkCount": {
        "value": 3,
        "unit": "count",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "pause": {
        "value": 3,
        "unit": "second",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "selfClearing": {
        "value": "YES",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G08",
        "reason": "p136 AND versus p146 either invalid value; no combined predicate selected.",
        "source": {
          "evidenceId": "F15"
        }
      },
      "outputBehavior": {
        "value": "Track O2",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F15"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "line-frequency",
      "number": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G13",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F16"
        }
      },
      "alarm": {
        "value": "Incorrect line frequency detected on power up",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F16"
        }
      },
      "loiMessage": {
        "value": "Line Freq Error",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F16"
        }
      },
      "diagnosticLed": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G13",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F16"
        }
      },
      "blinkCount": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G13",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F16"
        }
      },
      "pause": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G13",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F16"
        }
      },
      "selfClearing": {
        "value": "NO",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F16"
        }
      },
      "triggerDescription": {
        "value": "Incorrect line frequency on power-up; numeric detection criterion NOT SPECIFIED IN SOURCE MANUAL",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F16"
        }
      },
      "outputBehavior": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G13",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F16"
        }
      },
      "simulationImplemented": false
    },
    {
      "id": "calibration-recommended",
      "number": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F17"
        }
      },
      "alarm": {
        "value": "Calibration Recommended / High AC Impedance",
        "unit": "text",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F17"
        }
      },
      "loiMessage": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F17"
        }
      },
      "diagnosticLed": {
        "value": "CALIBRATION RECOMMENDED indication retained in descriptions",
        "unit": "LED",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F17"
        }
      },
      "blinkCount": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F17"
        }
      },
      "pause": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G12",
        "reason": "NOT SPECIFIED IN SOURCE MANUAL",
        "source": {
          "evidenceId": "F17"
        }
      },
      "selfClearing": {
        "value": "YES in historical Table2-8; current trigger disabled",
        "unit": "state",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F17"
        }
      },
      "triggerDescription": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G05",
        "reason": "Disabled in2014; retained historical descriptions are not an enabled trigger.",
        "source": {
          "evidenceId": "F17"
        }
      },
      "outputBehavior": {
        "value": "Track O2 in historical Table2-8",
        "unit": "rule",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "F17"
        }
      },
      "historicalOnly": true,
      "simulationImplemented": false
    }
  ],
  "testPoints": [
    {
      "id": "TP1/TP2",
      "positive": {
        "value": "TP1",
        "unit": "terminal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "negative": {
        "value": "TP2",
        "unit": "terminal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "role": {
        "value": "Raw oxygen cell EMF",
        "unit": "signal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "unit": {
        "value": "mV",
        "unit": "unit",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "continuousConversion": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G01",
        "reason": "Exact reference points only",
        "source": {
          "evidenceId": "E65"
        }
      }
    },
    {
      "id": "TP3/TP4",
      "positive": {
        "value": "TP3",
        "unit": "terminal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "negative": {
        "value": "TP4",
        "unit": "terminal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "role": {
        "value": "Heater thermocouple voltage",
        "unit": "signal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "unit": {
        "value": "mV",
        "unit": "unit",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "temperatureConversion": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G09",
        "reason": "No complete temperature-voltage function",
        "source": {
          "evidenceId": "E49"
        }
      }
    },
    {
      "id": "TP5/TP6",
      "positive": {
        "value": "TP5",
        "unit": "terminal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "negative": {
        "value": "TP6",
        "unit": "terminal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "role": {
        "value": "Process/test gas O2 indication",
        "unit": "signal",
        "status": "SUPPORTED",
        "source": {
          "evidenceId": "E49"
        }
      },
      "examples": [
        {
          "oxygenPercent": {
            "value": 8,
            "unit": "% O2",
            "status": "SUPPORTED",
            "source": {
              "evidenceId": "E50"
            }
          },
          "voltage": {
            "value": 8,
            "unit": "Vdc",
            "status": "SUPPORTED",
            "source": {
              "evidenceId": "E50"
            }
          }
        },
        {
          "oxygenPercent": {
            "value": 0.4,
            "unit": "% O2",
            "status": "SUPPORTED",
            "source": {
              "evidenceId": "E50"
            }
          },
          "voltage": {
            "value": 0.4,
            "unit": "Vdc",
            "status": "SUPPORTED",
            "source": {
              "evidenceId": "E50"
            }
          }
        }
      ],
      "generalConversion": {
        "status": "UNSUPPORTED",
        "availability": "BLOCKED",
        "gapId": "G11",
        "reason": "No general transfer equation authorized",
        "source": {
          "evidenceId": "E50"
        }
      }
    }
  ],
  "conflictingContexts": {
    "referenceAirSpecification": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G03",
      "reason": "Specification p32:2SCFH(1L/min),2.5psi(34kPa); installation p62:0.25L/min and5psi regulator; no single model value selected.",
      "source": {
        "evidenceId": "E20"
      }
    },
    "calibrationPressure": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G16",
      "reason": "p32 supply20psi; AppendixD line restriction<=1.1 atmospheric for specified installations; no pressure-location model.",
      "source": {
        "evidenceId": "E19"
      }
    },
    "processTemperature": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G04",
      "reason": "p32 705degC versus p38 704degC; no common rating chosen.",
      "source": {
        "evidenceId": "E07"
      }
    }
  },
  "startup": {
    "warmupLedSteps": {
      "value": [
        [
          "CALIBRATION"
        ],
        [
          "CALIBRATION",
          "O2 CELL"
        ],
        [
          "CALIBRATION",
          "O2 CELL",
          "HEATER"
        ],
        [
          "CALIBRATION",
          "O2 CELL",
          "HEATER",
          "HEATER T/C"
        ],
        []
      ],
      "unit": "LED set sequence",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E45"
      }
    },
    "normalLedSteps": {
      "value": [
        [
          "HEATER T/C"
        ],
        [
          "HEATER"
        ],
        [
          "O2 CELL"
        ],
        [
          "CALIBRATION"
        ]
      ],
      "unit": "LED set sequence",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E46"
      }
    },
    "powerApplied": {
      "value": "Heater turns ON; WARM UP",
      "unit": "transition",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E44"
      }
    },
    "operatingReached": {
      "value": "NORMAL OPERATION after cell at operating temperature",
      "unit": "transition",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E52"
      }
    },
    "loiWarmup": {
      "value": "Warm up",
      "unit": "display",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E52"
      }
    },
    "loiNormal": {
      "value": "O2 concentration display",
      "unit": "display",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E52"
      }
    },
    "startupFault": {
      "value": "Error at startup produces an alarm indication",
      "unit": "transition",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E52"
      }
    },
    "powerRemoved": {
      "value": "POWER OFF",
      "unit": "transition",
      "status": "SUPPORTED",
      "source": {
        "evidenceId": "E42"
      }
    }
  },
  "blockedCapabilities": {
    "continuousMeasurement": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G01",
      "reason": "No interpolation/extrapolation/Nernst solver",
      "source": {
        "evidenceId": "E02"
      }
    },
    "analogMapping": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G02",
      "reason": "No general O2-to-current formula",
      "source": {
        "evidenceId": "E58"
      }
    },
    "calibrationMath": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G08",
      "reason": "No slope/constant computation",
      "source": {
        "evidenceId": "E67"
      }
    },
    "heaterDynamics": {
      "status": "UNSUPPORTED",
      "availability": "BLOCKED",
      "gapId": "G09",
      "reason": "No temperature trajectory",
      "source": {
        "evidenceId": "E44"
      }
    }
  }
};
validateFixtureTree(data, data.evidence);
export const SOURCE_DATA = deepFreeze(data);
