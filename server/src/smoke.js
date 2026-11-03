const base = 'http://localhost:4000/api';

async function call(method, path, token, body) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}
const login = async (email) =>
  (await call('POST', '/auth/login', null, { email, password: 'Demo@1234' })).data.token;

const tokens = {
  lead: await login('meera@demo.test'),
  leaver: await login('aarav@demo.test'),
  joiner: await login('kiran@demo.test'),
};

async function view(label) {
  const rows = [];
  for (const role of ['lead', 'leaver', 'joiner']) {
    const { data } = await call('GET', '/items', tokens[role]);
    rows.push({
      role,
      visible: data.items.length,
      restricted_placeholder: data.restricted,
      leads_only_items_visible: data.items.filter((i) => i.access_label === 'leads_only').length,
      sponsor_quotes_visible: data.items.flatMap((i) => i.evidence).filter((e) => e.source === 'Sponsor sheet').length,
    });
  }
  console.log(`\n${label}`);
  console.table(rows);
}

console.log('Load demo:', (await call('POST', '/handover/load-demo', tokens.lead)).status);
await view('1) Before any approval');
console.log('Approve all green:', (await call('POST', '/items/approve-green', tokens.lead)).data);
await view('2) After the lead approves the green items');
console.log('Joiner tries to approve (expect 403):',
  (await call('POST', '/items/1/review', tokens.joiner, { action: 'approve' })).status);
console.log('\nReadiness:', JSON.stringify((await call('GET', '/readiness', tokens.lead)).data, null, 2));