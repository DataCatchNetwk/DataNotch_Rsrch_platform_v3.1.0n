import fs from "node:fs";

const BASE = "http://localhost:3001";
const email = "jgodwin@datanotchplatform.org";
const password = "qwerty21";

async function run(){
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ identifier: email, password }) });
  const loginJson = await loginRes.json();
  const token = loginJson?.token ?? loginJson?.accessToken;
  if(!token){ throw new Error(`login failed: ${JSON.stringify(loginJson)}`); }

  const workspaceId = "cmqy6cklo001om5vc5me4hyen";

  fs.mkdirSync("tmp", { recursive: true });
  const csvPath = "tmp/upload-smoke.csv";
  fs.writeFileSync(csvPath, "id,value\\n1,42\\n2,99\\n", "utf8");

  const form = new FormData();
  form.append("archive", new Blob([fs.readFileSync(csvPath)]), "upload-smoke.csv");

  const uploadRes = await fetch(`${BASE}/api/workspace-zip/workspaces/${workspaceId}/upload-zip`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${token}` },
    body: form,
  });
  const uploadText = await uploadRes.text();

  console.log(JSON.stringify({ status: uploadRes.status, body: uploadText }, null, 2));
}

run().catch(e => { console.error(String(e?.stack || e)); process.exit(1); });
