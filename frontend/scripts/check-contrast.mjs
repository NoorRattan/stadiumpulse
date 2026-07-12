const palettes = {
  light: {
    background: "#f8f9fa",
    foreground: "#0a0a0a",
    card: "#ffffff",
    mutedForeground: "#5f6368",
    primary: "#00a86b",
    primaryForeground: "#ffffff",
    accent: "#0099cc",
    accentForeground: "#ffffff",
    destructive: "#e63946",
  },
  dark: {
    background: "#030303",
    foreground: "#fafafa",
    card: "#0a0a0a",
    mutedForeground: "#a1a1aa",
    primary: "#00ff88",
    primaryForeground: "#030303",
    accent: "#00d4ff",
    accentForeground: "#030303",
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
