const BASE = "http://localhost:3001";
const email = "jgodwin@datanotchplatform.org";
const password = "qwerty21";

async function run(){
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ identifier: email, password }) });
  const loginJson = await loginRes.json();
  const token = loginJson?.token ?? loginJson?.accessToken;
  if(!token){ throw new Error(`login failed: ${JSON.stringify(loginJson)}`); }

  const filesRes = await fetch(`${BASE}/api/workspace-zip/workspaces/cmqy6cklo001om5vc5me4hyen/files`, { headers:{ Authorization:`Bearer ${token}` } });
  const filesJson = await filesRes.json();

  function flatten(nodes, out=[]){ for(const n of nodes||[]){ out.push(n); flatten(n.children, out);} return out; }
  const nodes = flatten(filesJson?.tree || []);
  const sample = nodes.slice(0, 10).map(n => ({ id:n.id, name:n.name, kind:n.kind, ext:n.extension, cand:n.isDatasetCandidate, datasetId:n.datasetId }));

  console.log(JSON.stringify({ total: nodes.length, sample }, null, 2));
}

run().catch(e => { console.error(String(e?.stack || e)); process.exit(1); });
