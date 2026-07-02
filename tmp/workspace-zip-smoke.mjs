import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const BASE = "http://localhost:3001";
const email = "jgodwin@datanotchplatform.org";
const password = "qwerty21";

async function run() {
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson?.accessToken ?? loginJson?.token;
  if (!token) throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);

  async function authed(pathname, init = {}) {
    const res = await fetch(`${BASE}${pathname}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    return { ok: res.ok, status: res.status, json };
  }

  const mine = await authed(`/api/workspaces/mine`);
  const workspaceId = mine?.json?.workspaces?.[0]?.id ?? mine?.json?.[0]?.id;
  if (!workspaceId) throw new Error(`No workspace available: ${JSON.stringify(mine)}`);

  fs.mkdirSync("tmp", { recursive: true });
  const zipPath = path.resolve("tmp", `workspace-smoke-${Date.now()}.zip`);
  const srcDir = path.resolve("tmp", `zip-src-${Date.now()}`);
  fs.mkdirSync(srcDir, { recursive: true });
  const csvPath = path.join(srcDir, "smoke-dataset.csv");
  fs.writeFileSync(csvPath, "id,value\\n1,42\\n2,99\\n", "utf8");
  execSync(`Compress-Archive -Path \"${srcDir}\\*\" -DestinationPath \"${zipPath}\" -Force`, { stdio: "pipe", shell: "powershell.exe" });

  const form = new FormData();
  form.append("archive", new Blob([fs.readFileSync(zipPath)]), path.basename(zipPath));

  const upload = await authed(`/api/workspace-zip/workspaces/${workspaceId}/upload-zip`, {
    method: "POST",
    body: form,
  });
  const files = await authed(`/api/workspace-zip/workspaces/${workspaceId}/files`);

  function flatten(nodes, out = []) {
    for (const n of nodes || []) {
      out.push(n);
      flatten(n.children, out);
    }
    return out;
  }

  const allFiles = flatten(files?.json?.tree || []);
  const datasetCandidates = allFiles.filter((f) => f.isDatasetCandidate);
  const candidate = datasetCandidates.find((f) => !f.datasetId) ?? datasetCandidates[0];
  if (!candidate) {
    throw new Error(`No dataset candidates found. Upload=${JSON.stringify(upload)} files=${JSON.stringify(allFiles.slice(0, 5))}`);
  }

  const register = candidate.datasetId
    ? { ok: true, status: 200, json: { success: true, skipped: true, datasetId: candidate.datasetId } }
    : await authed(`/api/workspace-zip/workspaces/${workspaceId}/files/${candidate.id}/register-raw`, { method: "POST" });

  const profiling = await authed(`/api/workspace-zip/workspaces/${workspaceId}/files/${candidate.id}/send-to-preparation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage: "profiling" }),
  });

  console.log(JSON.stringify({
    workspaceId,
    upload,
    datasetCandidates: datasetCandidates.length,
    candidate: { id: candidate.id, name: candidate.name, path: candidate.relativePath, datasetId: candidate.datasetId ?? null },
    register,
    profiling,
  }, null, 2));
}

run().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
