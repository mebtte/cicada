function capitalize(s: string) {
  return s
    .split(' ')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}

export default capitalize;
