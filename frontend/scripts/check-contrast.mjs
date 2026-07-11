const palettes = {
  light: {
    background: "#f6f8f5",
    foreground: "#10231b",
    card: "#ffffff",
    mutedForeground: "#475d53",
    primary: "#0b6b47",
    primaryForeground: "#ffffff",
    accent: "#006880",
    accentForeground: "#ffffff",
    destructive: "#b42335",
  },
  dark: {
    background: "#07110d",
    foreground: "#f2f8f4",
    card: "#0e1c16",
    mutedForeground: "#b7c8be",
    primary: "#50d89b",
    primaryForeground: "#042116",
    accent: "#68d7ee",
    accentForeground: "#042026",
    destructive: "#ff7a88",
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
