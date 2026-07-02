const BASE = "http://localhost:3001";
const email = "jgodwin@datanotchplatform.org";
const password = "qwerty21";

async function run(){
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ identifier: email, password }) });
  const loginJson = await loginRes.json();
  const token = loginJson?.token ?? loginJson?.accessToken;
  if(!token){ throw new Error(`login failed: ${JSON.stringify(loginJson)}`); }

  const workspaceId = "cmqy6cklo001om5vc5me4hyen";
  const filesRes = await fetch(`${BASE}/api/workspace-zip/workspaces/${workspaceId}/files`, { headers:{ Authorization:`Bearer ${token}` } });
  const filesJson = await filesRes.json();

  function flatten(nodes, out=[]){ for(const n of nodes||[]){ out.push(n); flatten(n.children, out);} return out; }
  const nodes = flatten(filesJson?.tree || []);
  const candidate = nodes.find(n => n.isDatasetCandidate && !n.datasetId) || nodes.find(n => n.isDatasetCandidate);
  if(!candidate){ throw new Error('no candidate found'); }

  const regRes = await fetch(`${BASE}/api/workspace-zip/workspaces/${workspaceId}/files/${candidate.id}/register-raw`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
  const regText = await regRes.text();

  const prepRes = await fetch(`${BASE}/api/workspace-zip/workspaces/${workspaceId}/files/${candidate.id}/send-to-preparation`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
    body: JSON.stringify({ stage: "profiling" }),
  });
  const prepText = await prepRes.text();

  console.log(JSON.stringify({
    candidate: { id: candidate.id, name: candidate.name, datasetId: candidate.datasetId ?? null },
    register: { status: regRes.status, body: regText },
    profiling: { status: prepRes.status, body: prepText }
  }, null, 2));
}

run().catch(e => { console.error(String(e?.stack || e)); process.exit(1); });
