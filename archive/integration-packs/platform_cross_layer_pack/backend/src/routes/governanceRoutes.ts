import { Router } from 'express';
export const governanceRouter = Router();

governanceRouter.get('/audit', (_req, res) => res.json([
  { id: 'aud_1', actor: 'Jerry', action: 'REGISTER_DATASET', object: 'ACS_SDOH.csv', stage: 'DATA_MANAGEMENT' },
  { id: 'aud_2', actor: 'DataNotch', action: 'RUN_PREP_PIPELINE', object: 'SDOH v3.2', stage: 'DATA_PREPARATION' },
]));

governanceRouter.get('/lineage', (_req, res) => res.json({
  nodes: ['ZIP Upload','Workspace File','Raw Dataset','Clean Dataset','Feature Set','Experiment','Analysis Result','Publication'],
  edges: [['ZIP Upload','Workspace File'],['Workspace File','Raw Dataset'],['Raw Dataset','Clean Dataset'],['Clean Dataset','Feature Set'],['Feature Set','Experiment'],['Experiment','Analysis Result'],['Analysis Result','Publication']]
}));
