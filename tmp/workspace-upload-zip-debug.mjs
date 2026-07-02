import fs from "node:fs";
import { execSync } from "node:child_process";

const BASE = "http://localhost:3001";
const email = "jgodwin@datanotchplatform.org";
const password = "qwerty21";

async function run(){
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ identifier: email, password }) });
  const loginJson = await loginRes.json();
  const token = loginJson?.token ?? loginJson?.accessToken;
  if(!token){ throw new Error(`login failed: ${JSON.stringify(loginJson)}`); }

  fs.mkdirSync("tmp", { recursive: true });
  fs.mkdirSync("tmp/pszip", { recursive: true });
  fs.writeFileSync("tmp/pszip/smoke-dataset.csv", "id,value\\n1,42\\n2,99\\n", "utf8");
  execSync('Compress-Archive -Path "tmp/pszip/*" -DestinationPath "tmp/pszip.zip" -Force', { shell: 'powershell.exe', stdio: 'pipe' });

  const workspaceId = "cmqy6cklo001om5vc5me4hyen";
  const form = new FormData();
  form.append("archive", new Blob([fs.readFileSync("tmp/pszip.zip")]), "pszip.zip");

  const uploadRes = await fetch(`${BASE}/api/workspace-zip/workspaces/${workspaceId}/upload-zip`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${token}` },
    body: form,
  });
  const uploadText = await uploadRes.text();

  const filesRes = await fetch(`${BASE}/api/workspace-zip/workspaces/${workspaceId}/files`, { headers:{ Authorization:`Bearer ${token}` } });
  const filesText = await filesRes.text();

  console.log(JSON.stringify({ uploadStatus: uploadRes.status, uploadBody: uploadText, filesStatus: filesRes.status, filesBody: filesText.slice(0, 800) }, null, 2));
}

run().catch(e => { console.error(String(e?.stack || e)); process.exit(1); });
