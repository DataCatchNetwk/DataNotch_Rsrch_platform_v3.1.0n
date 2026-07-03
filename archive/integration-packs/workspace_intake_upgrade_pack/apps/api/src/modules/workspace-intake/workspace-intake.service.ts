import fs from "fs";
import path from "path";
import crypto from "crypto";
import unzipper from "unzipper";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STORAGE_ROOT = process.env.WORKSPACE_STORAGE_ROOT || path.resolve(process.cwd(), "storage/workspaces");

const DATASET_EXTENSIONS = new Set([".csv", ".xlsx", ".xls", ".json", ".parquet", ".tsv"]);

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function checksum(filePath: string) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function isDatasetCandidate(fileName: string) {
  return DATASET_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export class WorkspaceIntakeService {
  async summary() {
    const [workspaces, files, archives, candidates] = await Promise.all([
      prisma.workspace.count().catch(() => 0),
      prisma.workspaceFile.count().catch(() => 0),
      prisma.workspaceFile.count({ where: { kind: "archive" } }).catch(() => 0),
      prisma.workspaceDatasetCandidate.count({ where: { status: "detected" } }).catch(() => 0),
    ]);

    return {
      workspaces,
      members: await prisma.workspaceMember.count().catch(() => 0),
      datasets: await prisma.dataset.count().catch(() => 0),
      files,
      archives,
      candidates,
    };
  }

  async listWorkspaces() {
    const rows = await prisma.workspace.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        members: true,
        files: true,
        datasetCandidates: true,
        datasets: true,
      },
    }).catch(() => []);

    return rows.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description || "",
      owner: w.ownerName || "Jerry Godwin",
      status: w.status || "ACTIVE",
      members: w.members?.length ?? 0,
      datasets: w.datasets?.length ?? 0,
      files: w.files?.length ?? 0,
      candidates: w.datasetCandidates?.filter((c: any) => c.status === "detected").length ?? 0,
      updatedAt: w.updatedAt,
    }));
  }

  async createWorkspace(input: { name: string; description?: string }) {
    return prisma.workspace.create({
      data: {
        name: input.name,
        description: input.description || "",
        ownerName: "Jerry Godwin",
        status: "ACTIVE",
      },
    });
  }

  async uploadFiles(workspaceId: string, files: Express.Multer.File[]) {
    const workspaceDir = path.join(STORAGE_ROOT, workspaceId);
    ensureDir(workspaceDir);

    const uploaded: any[] = [];
    const candidates: any[] = [];

    for (const file of files) {
      const cleanOriginalName = safeName(file.originalname);
      const finalPath = path.join(workspaceDir, cleanOriginalName);
      fs.renameSync(file.path, finalPath);

      const ext = path.extname(cleanOriginalName).toLowerCase();
      const kind = ext === ".zip" ? "archive" : "file";

      const createdFile = await prisma.workspaceFile.create({
        data: {
          workspaceId,
          name: cleanOriginalName,
          kind,
          type: ext.replace(".", "") || "unknown",
          size: file.size,
          path: finalPath,
          relativePath: cleanOriginalName,
          checksum: checksum(finalPath),
          datasetCandidate: isDatasetCandidate(cleanOriginalName),
        },
      });

      uploaded.push(createdFile);

      if (ext === ".zip") {
        const extractDir = path.join(workspaceDir, cleanOriginalName.replace(/\.zip$/i, ""));
        ensureDir(extractDir);
        await fs.createReadStream(finalPath).pipe(unzipper.Extract({ path: extractDir })).promise();

        const extracted = this.walkFiles(extractDir);
        for (const extractedPath of extracted) {
          const rel = path.relative(workspaceDir, extractedPath);
          const stat = fs.statSync(extractedPath);
          const extractedName = path.basename(extractedPath);
          const extractedIsDataset = isDatasetCandidate(extractedName);

          const extractedFile = await prisma.workspaceFile.create({
            data: {
              workspaceId,
              parentId: createdFile.id,
              name: extractedName,
              kind: "file",
              type: path.extname(extractedName).replace(".", "") || "unknown",
              size: stat.size,
              path: extractedPath,
              relativePath: rel,
              checksum: checksum(extractedPath),
              datasetCandidate: extractedIsDataset,
            },
          });

          uploaded.push(extractedFile);

          if (extractedIsDataset) {
            candidates.push(await this.createCandidate(workspaceId, extractedFile.id, extractedName));
          }
        }
      } else if (isDatasetCandidate(cleanOriginalName)) {
        candidates.push(await this.createCandidate(workspaceId, createdFile.id, cleanOriginalName));
      }
    }

    await this.audit(workspaceId, "WORKSPACE_UPLOAD", { uploaded: uploaded.length, candidates: candidates.length });
    return { uploaded, candidates };
  }

  walkFiles(dir: string): string[] {
    const results: string[] = [];
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) results.push(...this.walkFiles(full));
      else results.push(full);
    }
    return results;
  }

  async createCandidate(workspaceId: string, fileId: string, name: string) {
    const ext = path.extname(name).replace(".", "").toUpperCase();
    return prisma.workspaceDatasetCandidate.create({
      data: {
        workspaceId,
        fileId,
        name,
        format: ext,
        rowsEstimate: 1000,
        columnsEstimate: 12,
        confidence: 92,
        status: "detected",
      },
    });
  }

  async files(workspaceId: string) {
    return prisma.workspaceFile.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  }

  async candidates(workspaceId: string) {
    return prisma.workspaceDatasetCandidate.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  }

  async registerDataset(workspaceId: string, candidateId: string) {
    const candidate = await prisma.workspaceDatasetCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new Error("Dataset candidate not found");

    const dataset = await prisma.dataset.create({
      data: {
        name: candidate.name,
        workspaceId,
        sourceType: "WORKSPACE_FILE",
        status: "RAW",
        stage: "RAW_DATASET",
        format: candidate.format,
        rowsEstimate: candidate.rowsEstimate,
        columnsEstimate: candidate.columnsEstimate,
      },
    });

    await prisma.workspaceDatasetCandidate.update({
      where: { id: candidateId },
      data: { status: "registered", datasetId: dataset.id },
    });

    await this.audit(workspaceId, "REGISTER_DATASET", { candidateId, datasetId: dataset.id });

    return {
      datasetId: dataset.id,
      nextUrl: `/dashboard/datasets?view=raw&datasetId=${dataset.id}`,
    };
  }

  async createProject(workspaceId: string, input: { title: string; objective: string }) {
    const project = await prisma.project.create({
      data: {
        workspaceId,
        title: input.title,
        objective: input.objective,
        status: "ACTIVE",
      },
    });

    await this.audit(workspaceId, "CREATE_PROJECT", { projectId: project.id });
    return project;
  }

  async createTask(workspaceId: string, input: { title: string; stage: string; assignee?: string }) {
    const task = await prisma.workspaceTask.create({
      data: {
        workspaceId,
        title: input.title,
        stage: input.stage,
        assignee: input.assignee || null,
        status: "TODO",
      },
    });

    await this.audit(workspaceId, "CREATE_TASK", { taskId: task.id });
    return task;
  }

  async assignTeam(workspaceId: string, input: { email: string; role: string }) {
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        email: input.email,
        role: input.role,
      },
    });

    await this.audit(workspaceId, "ASSIGN_TEAM", { memberId: member.id });
    return member;
  }

  async handoff(workspaceId: string, target: string) {
    const routes: Record<string, string> = {
      "data-management": `/dashboard/datasets?workspaceId=${workspaceId}`,
      "dataset-registry": `/dashboard/datasets?view=raw&workspaceId=${workspaceId}`,
      "data-preparation": `/dashboard/datasets?prep=profiling&workspaceId=${workspaceId}`,
      "research-studio": `/dashboard/research/questions?workspaceId=${workspaceId}`,
      "analytics-ai": `/dashboard/analysis-studio?workspaceId=${workspaceId}`,
      outputs: `/dashboard/reports?workspaceId=${workspaceId}`,
      "runtime-monitoring": `/dashboard/monitoring/pipelines?workspaceId=${workspaceId}`,
    };

    await this.audit(workspaceId, "HANDOFF", { target, nextUrl: routes[target] || "/" });
    return { target, nextUrl: routes[target] || "/" };
  }

  async audit(workspaceId: string, action: string, metadata: unknown) {
    return prisma.auditLog.create({
      data: {
        workspaceId,
        action,
        resourceType: "WORKSPACE",
        metadata: metadata as any,
      },
    }).catch(() => null);
  }
}
