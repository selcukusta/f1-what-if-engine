import { generateRaceData, type RaceConfig } from "./lib/openf1";

const config: RaceConfig = {
  sessionKey: 11280,
  name: "Miami Grand Prix",
  year: 2026,
  totalLaps: 57,
  pitLossSec: 24,
  fallbackPace: 93.0,
  outputFile: "miami-2026.json",

  gridOrder: {
    1: 1,   // NOR
    81: 2,  // PIA
    12: 3,  // ANT
    63: 4,  // RUS
    3: 5,   // VER
    44: 6,  // HAM
    16: 7,  // LEC
    55: 8,  // SAI
    43: 9,  // COL
    10: 10, // GAS
    87: 11, // BEA
    23: 12, // ALB
    6: 13,  // HAD
    31: 14, // OCO
    5: 15,  // BOR
    30: 16, // LAW
    41: 17, // LIN
    27: 18, // HUL
    14: 19, // ALO
    18: 20, // STR
    11: 21, // PER
    77: 22, // BOT
  },

  defaultStrategies: {
    12: [{ compound: "medium", endLap: 26 }, { compound: "hard", endLap: 57 }],
    1:  [{ compound: "medium", endLap: 27 }, { compound: "hard", endLap: 57 }],
    81: [{ compound: "medium", endLap: 28 }, { compound: "hard", endLap: 57 }],
    63: [{ compound: "medium", endLap: 20 }, { compound: "hard", endLap: 57 }],
    3:  [{ compound: "medium", endLap: 6 },  { compound: "hard", endLap: 57 }],
    16: [{ compound: "medium", endLap: 21 }, { compound: "hard", endLap: 57 }],
    44: [{ compound: "medium", endLap: 27 }, { compound: "hard", endLap: 57 }],
    43: [{ compound: "medium", endLap: 25 }, { compound: "hard", endLap: 57 }],
    55: [{ compound: "medium", endLap: 23 }, { compound: "hard", endLap: 57 }],
    23: [{ compound: "medium", endLap: 24 }, { compound: "hard", endLap: 57 }],
    87: [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
    5:  [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
    31: [{ compound: "medium", endLap: 24 }, { compound: "hard", endLap: 57 }],
    41: [{ compound: "medium", endLap: 23 }, { compound: "hard", endLap: 57 }],
    14: [{ compound: "medium", endLap: 41 }, { compound: "soft", endLap: 57 }],
    11: [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
    18: [{ compound: "medium", endLap: 21 }, { compound: "soft", endLap: 37 }, { compound: "soft", endLap: 57 }],
    77: [{ compound: "medium", endLap: 6 },  { compound: "soft", endLap: 21 }, { compound: "medium", endLap: 30 }, { compound: "medium", endLap: 57 }],
    27: [{ compound: "medium", endLap: 22 }, { compound: "hard", endLap: 57 }],
    30: [{ compound: "medium", endLap: 23 }, { compound: "hard", endLap: 57 }],
    10: [{ compound: "medium", endLap: 25 }, { compound: "hard", endLap: 57 }],
    6:  [{ compound: "medium", endLap: 24 }, { compound: "hard", endLap: 57 }],
  },

  actualFinishOrder: [
    12, 1, 81, 63, 3, 16, 44, 43, 55, 23,
    87, 5, 31, 41, 14, 11, 18, 77, 27, 30, 10, 6,
  ],
};

generateRaceData(config).catch(console.error);
