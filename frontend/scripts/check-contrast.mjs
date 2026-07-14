const palettes = {
  light: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    foreground: "#0F172A",
    mutedForeground: "#475569",
    primary: "#006C75",
    primaryForeground: "#FFFFFF",
    secondary: "#A80052",
    secondaryForeground: "#FFFFFF",
    accent: "#855300",
    accentForeground: "#FFFFFF",
    destructive: "#B42352",
    destructiveForeground: "#FFFFFF",
    success: "#006C75",
    successForeground: "#FFFFFF",
    warning: "#855300",
    warningForeground: "#FFFFFF",
    info: "#075985",
    infoForeground: "#FFFFFF",
    border: "#CBD5E1",
    brandCyan: "#00F0FF",
    brandMagenta: "#FF007F",
    brandAmber: "#FBBF24",
    brandDeep: "#020617",
  },
  dark: {
    background: "#0B1121",
    card: "#0F172A",
    foreground: "#F1F5F9",
    mutedForeground: "#94A3B8",
    primary: "#00F0FF",
    primaryForeground: "#020617",
    secondary: "#FF007F",
    secondaryForeground: "#020617",
    accent: "#FBBF24",
    accentForeground: "#020617",
    destructive: "#FF5C9F",
    destructiveForeground: "#020617",
    success: "#00F0FF",
    successForeground: "#020617",
    warning: "#FBBF24",
    warningForeground: "#020617",
    info: "#7DD3FC",
    infoForeground: "#020617",
    border: "#1E293B",
    brandCyan: "#00F0FF",
    brandMagenta: "#FF007F",
    brandAmber: "#FBBF24",
    brandDeep: "#020617",
  },
  highContrast: {
    background: "#000000",
    card: "#000000",
    foreground: "#FFFFFF",
    mutedForeground: "#FFFFFF",
    primary: "#00F0FF",
    primaryForeground: "#000000",
    secondary: "#FF5C9F",
    secondaryForeground: "#000000",
    accent: "#FBBF24",
    accentForeground: "#000000",
    destructive: "#FF8FBD",
    destructiveForeground: "#000000",
    success: "#00F0FF",
    successForeground: "#000000",
    warning: "#FBBF24",
    warningForeground: "#000000",
    info: "#7DD3FC",
    infoForeground: "#000000",
    border: "#FFFFFF",
    brandCyan: "#00F0FF",
    brandMagenta: "#FF007F",
    brandAmber: "#FBBF24",
    brandDeep: "#020617",
  },
};

function luminance(hex) {
  const values = hex
    .match(/[a-f\d]{2}/gi)
    .map((value) => parseInt(value, 16) / 255);
  const [red, green, blue] = values.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function ratio(first, second) {
  const [high, low] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (high + 0.05) / (low + 0.05);
}

const textTokens = [
  "foreground",
  "mutedForeground",
  "primary",
  "secondary",
  "accent",
  "destructive",
  "success",
  "warning",
  "info",
];

const controlPairs = [
  ["primary button", "primaryForeground", "primary"],
  ["secondary button", "secondaryForeground", "secondary"],
  ["accent button", "accentForeground", "accent"],
  ["destructive button", "destructiveForeground", "destructive"],
  ["success status", "successForeground", "success"],
  ["warning status", "warningForeground", "warning"],
  ["info status", "infoForeground", "info"],
  ["gradient on cyan", "brandDeep", "brandCyan"],
  ["gradient on magenta", "brandDeep", "brandMagenta"],
  ["gradient on amber", "brandDeep", "brandAmber"],
];

let failed = false;
for (const [theme, colors] of Object.entries(palettes)) {
  console.log(`${theme.toUpperCase()} TOKEN CONTRAST`);
  for (const token of textTokens) {
    const onBackground = ratio(colors[token], colors.background);
    const onCard = ratio(colors[token], colors.card);
    const passes = onBackground >= 4.5 && onCard >= 4.5;
    failed ||= !passes;
    console.log(
      `${token} ${colors[token]} | background ${onBackground.toFixed(2)}:1 | card ${onCard.toFixed(2)}:1 ${passes ? "PASS" : "FAIL"}`,
    );
  }
  console.log(`border ${colors.border} | decorative boundary (non-text)`);
  for (const [label, foreground, background] of controlPairs) {
    const result = ratio(colors[foreground], colors[background]);
    const passes = result >= 4.5;
    failed ||= !passes;
    console.log(
      `${label}: ${colors[foreground]} on ${colors[background]} = ${result.toFixed(2)}:1 ${passes ? "PASS" : "FAIL"}`,
    );
  }
}

if (failed) process.exitCode = 1;
