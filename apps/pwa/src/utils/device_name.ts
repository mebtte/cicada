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

const userAgentSignals = [
  /\bMozilla\//,
  /\bAppleWebKit\//,
  /\bChrome\//,
  /\bChromium\//,
  /\bSafari\//,
  /\bFirefox\//,
  /\bVersion\//,
  /\bMobile\//,
  /\bEdg\//,
  /\bOPR\//,
  /\bokhttp\//,
  /\bCFNetwork\//,
  /\bDarwin\//,
];

function matchName(userAgent: string, rules: [RegExp, string][]) {
  return rules.find(([pattern]) => pattern.test(userAgent))?.[1] || '';
}

export function getShortDeviceName(userAgent: string) {
  const browser = matchName(userAgent, browserRules);
  const os = matchName(userAgent, osRules);

  if (browser && os) return `${browser} on ${os}`;
  return browser || os;
}

export function getCurrentDeviceName() {
  return getShortDeviceName(window.navigator.userAgent);
}

export function looksLikeUserAgent(value: string) {
  return userAgentSignals.some((pattern) => pattern.test(value));
}

export function getDisplayDeviceName(deviceName: string, userAgent: string) {
  const name = deviceName.trim();
  if (name && !looksLikeUserAgent(name)) return name;
  return getShortDeviceName(userAgent) || name;
}
