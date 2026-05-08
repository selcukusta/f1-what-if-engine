import type { Translations } from "./types";

const tr: Translations = {
  lang: "tr",
  langLabel: "TR",

  challenge: {
    chooseTitle: "Bir Meydan Okuma Seç",
    acceptButton: "Meydan Okumayı Kabul Et",
    grid: "Grid",
    target: "Hedef",
    maxPitStops: (n: number) => `Maksimum ${n} pit stop`,
    laps: (n: number) => `${n} tur`,
    mustUseCompounds: "En az 2 farklı lastik kullanılmalı",
    play: "Oyna →",
  },

  strategy: {
    raceTimeline: "Yarış Zaman Çizelgesi",
    tireData: "Lastik Verileri",
    pace: "hız",
    lapDeg: "/tur yıpranma",
    lapLife: "tur ömrü",
    tireLifeWarning: (sec: number) =>
      `Lastik ömrü aşılırsa +2.0s/tur ceza · Pit stop maliyeti ${sec}s`,
    startingTire: "Başlangıç Lastiği",
    pitStop: (n: number) => `Pit Stop ${n}`,
    lap: "Tur",
    nextTire: "Sonraki Lastik",
    addStop: "Ekle",
    enabled: "Aktif",
    simulateButton: "Yarışı Simüle Et →",
    resetButton: "Sıfırla",
  },

  result: {
    was: "Önceki",
    now: "Şimdi",
    positionsGained: (n: number) =>
      `+${n} pozisyon kazanıldı`,
    positionsLost: (n: number) =>
      `${n} pozisyon kaybedildi`,
    yourStrategy: "Stratejin",
    keyMoments: "Önemli Anlar",
    showAll: (n: number) => `Tüm ${n} anı göster`,
    showLess: "Daha az göster",
    score: "Puan",
    shareButton: "Sonucu Paylaş",
    retryButton: "Tekrar Dene",
    homeButton: "Tüm Meydan Okumalar",
    shareTitle: (name: string, from: number, to: number) =>
      `${name}'i P${from}'dan P${to}'a çıkardım!`,
    shareText: "Stratejimi yenebilir misin? F1 What-If Engine",
    linkCopied: "Link panoya kopyalandı!",
  },

  moments: {
    overtake: "Geçiş",
    undercut: "Undercut",
    overcut: "Overcut",
    lostPosition: "Pozisyon kaybı",
    tireCliff: "Lastik aşınması",
    passed: (driver: string, pos: number) => `${driver} geçildi, P${pos}`,
    dropped: (pos: number) => `P${pos}'a düşüldü`,
    noChanges: "Pozisyon değişikliği yok — farklı bir strateji dene",
  },

  standings: {
    title: "Gerçek vs Simülasyonun",
    actualRace: "Gerçek Yarış",
    yourSimulation: "Simülasyonun",
    fullClassification: "Tüm Sıralama ↓",
  },

  chart: {
    title: "Yarış İlerlemesi",
    selectDrivers: (n: number) => `En fazla ${n} pilot seçebilirsin`,
    tireChange: "lastik değişimi",
    position: "Pozisyon",
  },

  share: {
    heading: "F1 What-If Engine",
    beatThis: "Bunu yenebilir misin? →",
  },

  butterfly: {
    title: "Kelebek Etkisi",
    gained: (name: string, n: number) =>
      `${name} senin stratejin sayesinde ${n} pozisyon kazandı`,
    lost: (name: string, n: number) =>
      `${name} senin stratejin yüzünden ${n} pozisyon kaybetti`,
  },

  difficulty: {
    easy: "Kolay",
    medium: "Orta",
    hard: "Zor",
  },

  tiers: {
    legendary: "Strateji Dahisi",
    excellent: "Podyum Kahramanı",
    target: "Görev Tamamlandı",
    improved: "Yaklaşıyorsun",
    unchanged: "Başa Dön",
    worse: "Plan Bu Değildi",
  },

  validation: {
    minPitStops: (n: number) => `En az ${n} pit stop gerekli`,
    maxPitStops: (n: number) => `Maksimum ${n} pit stop yapılabilir`,
    compoundCount: (expected: number, pits: number) =>
      `${pits} pit stop için ${expected} lastik bileşeni gerekli`,
    minCompounds: (n: number) => `En az ${n} farklı lastik kullanılmalı`,
    pitOrder: "Pit turları artan sırada olmalı",
    pitTooEarly: (lap: number, min: number) =>
      `${lap}. tur pit için çok erken (minimum tur ${min})`,
    pitTooLate: (lap: number, max: number) =>
      `${lap}. tur pit için çok geç (maksimum tur ${max})`,
    stintTooShort: (stint: number, len: number, min: number) =>
      `${stint}. stint sadece ${len} tur (minimum ${min})`,
  },
} as const;

export default tr;
