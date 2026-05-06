import { generateRaceData, type RaceConfig } from "./lib/openf1";

const config: RaceConfig = {
  sessionKey: 9523,
  name: "Monaco Grand Prix",
  year: 2024,
  totalLaps: 78,
  pitLossSec: 22,
  fallbackPace: 78.0,
  outputFile: "monaco-2024.json",

  gridOrder: {
    16: 1,  // LEC
    81: 2,  // PIA
    55: 3,  // SAI
    4: 4,   // NOR
    63: 5,  // RUS
    1: 6,   // VER
    44: 7,  // HAM
    22: 8,  // TSU
    23: 9,  // ALB
    10: 10, // GAS
    31: 11, // OCO
    3: 12,  // RIC
    18: 13, // STR
    14: 14, // ALO
    2: 15,  // SAR
    11: 16, // PER
    77: 17, // BOT
    24: 18, // ZHO
    27: 19, // HUL
    20: 20, // MAG
  },

  defaultStrategies: {
    16: [{ compound: "medium", endLap: 30 }, { compound: "hard", endLap: 78 }],
    81: [{ compound: "medium", endLap: 28 }, { compound: "hard", endLap: 78 }],
    55: [{ compound: "medium", endLap: 32 }, { compound: "hard", endLap: 78 }],
    4:  [{ compound: "medium", endLap: 29 }, { compound: "hard", endLap: 78 }],
    63: [{ compound: "medium", endLap: 31 }, { compound: "hard", endLap: 78 }],
    1:  [{ compound: "hard", endLap: 33 },   { compound: "medium", endLap: 78 }],
    44: [{ compound: "hard", endLap: 35 },   { compound: "medium", endLap: 78 }],
    22: [{ compound: "medium", endLap: 27 }, { compound: "hard", endLap: 78 }],
    23: [{ compound: "hard", endLap: 35 },   { compound: "medium", endLap: 78 }],
    10: [{ compound: "medium", endLap: 30 }, { compound: "hard", endLap: 78 }],
    31: [{ compound: "medium", endLap: 28 }, { compound: "hard", endLap: 78 }],
    3:  [{ compound: "hard", endLap: 34 },   { compound: "medium", endLap: 78 }],
    18: [{ compound: "medium", endLap: 26 }, { compound: "hard", endLap: 78 }],
    14: [{ compound: "hard", endLap: 36 },   { compound: "medium", endLap: 78 }],
    2:  [{ compound: "hard", endLap: 38 },   { compound: "medium", endLap: 78 }],
    11: [{ compound: "medium", endLap: 31 }, { compound: "hard", endLap: 78 }],
    77: [{ compound: "hard", endLap: 35 },   { compound: "medium", endLap: 78 }],
    24: [{ compound: "medium", endLap: 29 }, { compound: "hard", endLap: 78 }],
    27: [{ compound: "hard", endLap: 33 },   { compound: "medium", endLap: 78 }],
    20: [{ compound: "hard", endLap: 34 },   { compound: "medium", endLap: 78 }],
  },

  actualFinishOrder: [
    16, 81, 55, 4, 63, 1, 44, 22, 23, 10,
    14, 3, 77, 18, 2, 24, 31, 11, 27, 20,
  ],
};

generateRaceData(config).catch(console.error);
