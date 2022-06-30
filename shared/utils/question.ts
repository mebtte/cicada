import readline from 'readline';

function question(q: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  return new Promise<string>((resolve) =>
    rl.question(q, (input) => resolve(input)),
  ).finally(() => rl.close());
}

export default question;
