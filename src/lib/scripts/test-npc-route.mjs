const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

const personas = ['manager', 'compliance', 'tech'];

const seedMessages = {
  manager: [
    { role: 'user', text: 'Give me a trade idea on SPY this morning.' },
  ],
  compliance: [
    { role: 'user', text: 'I want to take a 65% cash SPY position because momentum looks strong.' },
  ],
  tech: [
    { role: 'user', text: 'The order queue is frozen and fills look stale. What should I check?' },
  ],
};

function isValidPayload(obj) {
  return (
    obj &&
    typeof obj.reply === 'string' &&
    typeof obj.blocked === 'boolean' &&
    typeof obj.resolvesGlitch === 'boolean' &&
    (obj.instruction === null ||
      (obj.instruction &&
        (obj.instruction.action === 'buy' || obj.instruction.action === 'sell') &&
        typeof obj.instruction.sizePctOfCash === 'number' &&
        typeof obj.instruction.reason === 'string'))
  );
}

async function run() {
  const summary = [];

  for (const persona of personas) {
    let success = 0;
    let fail = 0;

    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BASE}/api/npc`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ persona, messages: seedMessages[persona] }),
      });

      const payload = await res.json();
      if (isValidPayload(payload)) success += 1;
      else fail += 1;
    }

    summary.push({ persona, success, fail });
  }

  console.log(JSON.stringify({ base: BASE, summary }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
