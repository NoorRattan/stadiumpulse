const palettes = {
  light: {
    background: "#f7faf9",
    foreground: "#10211c",
    card: "#ffffff",
    mutedForeground: "#51645f",
    primary: "#057a55",
    primaryForeground: "#ffffff",
    accent: "#007b99",
    accentForeground: "#ffffff",
    destructive: "#b31f43",
  },
  dark: {
    background: "#07110d",
    foreground: "#f2f7f5",
    card: "#0d1f19",
    mutedForeground: "#a6b2ae",
    primary: "#35e59a",
    primaryForeground: "#04130d",
    accent: "#4dd3ff",
    accentForeground: "#031318",
    destructive: "#ff4466",
  },
};

function luminance(hex) {
  const values = hex
    .match(/[a-f\d]{2}/gi)
    .map((value) => parseInt(value, 16) / 255);
  const [r, g, b] = values.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(first, second) {
  const [high, low] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (high + 0.05) / (low + 0.05);
}

const pairNames = [
  ["foreground/background", "foreground", "background"],
  ["muted text/background", "mutedForeground", "background"],
  ["muted text/card", "mutedForeground", "card"],
  ["primary button", "primaryForeground", "primary"],
  ["accent button", "accentForeground", "accent"],
  ["destructive/background", "destructive", "background"],
];

let failed = false;
for (const [theme, colors] of Object.entries(palettes)) {
  console.log(`${theme.toUpperCase()} THEME`);
  for (const [label, foreground, background] of pairNames) {
    const result = ratio(colors[foreground], colors[background]);
    const passes = result >= 4.5;
    failed ||= !passes;
    console.log(`${label}: ${result.toFixed(2)}:1 ${passes ? "PASS" : "FAIL"}`);
  }
}
if (failed) process.exitCode = 1;
