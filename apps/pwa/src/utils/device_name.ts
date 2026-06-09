const browserRules: [RegExp, string][] = [
  [/\bEdg\//, 'Edge'],
  [/\bOPR\//, 'Opera'],
  [/\bFirefox\/|\bFxiOS\//, 'Firefox'],
  [/\bCriOS\//, 'Chrome'],
  [/\bChrome\/|\bChromium\//, 'Chrome'],
  [/\bVersion\/.+\bSafari\//, 'Safari'],
];

const osRules: [RegExp, string][] = [
  [/\b(iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
  [/\bWindows NT\b/, 'Windows'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bLinux\b/, 'Linux'],
];

function matchName(userAgent: string, rules: [RegExp, string][]) {
  return rules.find(([pattern]) => pattern.test(userAgent))?.[1] || '';
}

function getShortDeviceName(userAgent: string) {
  const browser = matchName(userAgent, browserRules);
  const os = matchName(userAgent, osRules);

  if (browser && os) return `${browser} on ${os}`;
  return browser || os;
}

export function getCurrentDeviceName() {
  return getShortDeviceName(window.navigator.userAgent);
}

export function getDisplayDeviceName(deviceName: string) {
  return deviceName.trim();
}
