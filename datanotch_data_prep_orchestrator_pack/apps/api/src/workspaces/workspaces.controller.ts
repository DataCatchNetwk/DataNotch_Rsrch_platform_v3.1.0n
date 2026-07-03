import express from 'express';
import { prisma } from '../database/prisma';
export const workspacesRouter = express.Router();

workspacesRouter.post('/', async (req, res) => {
  const workspace = await prisma.workspace.create({ data: { name: req.body.name || 'Research Workspace' }});
  res.status(201).json(workspace);
});

workspacesRouter.get('/:id/datasets', async (req, res) => {
  const readyOnly = req.query.readyOnly !== 'false';
  const links = await prisma.workspaceDataset.findMany({
    where: { workspaceId: req.params.id, visible: true, dataset: readyOnly ? { status: 'READY_FOR_ANALYSIS' } : undefined },
    include: { dataset: { include: { assets: true }}},
    orderBy: { createdAt: 'desc' },
  });
  res.json(links.map(l => l.dataset));
});
