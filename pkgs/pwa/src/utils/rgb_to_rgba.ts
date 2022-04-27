export default (rgb: string, alpha: number) =>
  rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
