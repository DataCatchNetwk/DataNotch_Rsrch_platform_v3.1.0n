import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

type TableRow = {
  table_schema: string;
  table_name: string;
  table_type: string;
  column_count: bigint | number | null;
  estimated_rows: bigint | number | null;
  total_bytes: bigint | number | null;
};

type ColumnRow = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  ordinal_position: number;
  column_default: string | null;
};

type SchemaRow = {
  schema_name: string;
  table_count: bigint | number | null;
};

type IndexRow = {
  schema_name: string;
  table_name: string;
  index_name: string;
  index_definition: string;
};

type KeyRow = {
  schema_name: string;
  table_name: string;
  column_name: string;
  constraint_name: string;
  constraint_type: string;
};

type RelationRow = {
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
  constraint_name: string;
};

type SavedQuery = {
  id: string;
  name: string;
  sql: string;
  createdAt: string;
};

type QueryHistoryItem = {
  id: string;
  sql: string;
  status: 'SUCCEEDED' | 'FAILED';
  rowCount: number;
  executionMs: number;
  createdAt: string;
  message?: string;
};

type AuditItem = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

const savedQueries: SavedQuery[] = [
  {
    id: 'query-sdoh-preview',
    name: 'Preview SDOH patients',
    sql: 'SELECT *\nFROM sdoh_patients\nLIMIT 100;',
    createdAt: new Date().toISOString(),
  },
];
const queryHistory: QueryHistoryItem[] = [];
const databaseAuditLogs: AuditItem[] = [];

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  return 0;
}

function serializeValue(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, serializeValue(value)])),
  );
}

function maskDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '********';
    return parsed.toString();
  } catch {
    return 'configured';
  }
}

function getActor(req: Express.Request) {
  return req.user?.email ?? req.user?.id ?? 'authenticated-user';
}

function audit(req: Express.Request, action: string, target: string) {
  databaseAuditLogs.unshift({
    id: randomUUID(),
    actor: getActor(req),
    action,
    target,
    createdAt: new Date().toISOString(),
  });
  databaseAuditLogs.splice(25);
}

function normalizeSql(sql: unknown) {
  return String(sql ?? '').trim().replace(/;+\s*$/g, '');
}

function validateReadOnlySql(sql: string) {
  const compact = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--.*$/gm, ' ').trim();
  if (!compact) throw new Error('SQL query is required.');
  if (compact.includes(';')) {
    throw new Error('Only one read-only SQL statement can be executed at a time.');
  }
  if (!/^(select|with|explain)\b/i.test(compact)) {
    throw new Error('Only read-only SELECT, WITH, and EXPLAIN queries are allowed in Query Studio.');
  }
  const blocked = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|do|merge|vacuum|analyze|execute)\b/i;
  if (blocked.test(compact.replace(/^explain\s+/i, ''))) {
    throw new Error('Query Studio blocks write, DDL, and administrative SQL commands.');
  }
}

function limitSql(sql: string) {
  if (/^explain\b/i.test(sql) || /\blimit\s+\d+\b/i.test(sql)) return sql;
  return `${sql}\nLIMIT 100`;
}

function formatSql(sql: string) {
  const keywords = [
    'select',
    'from',
    'where',
    'join',
    'left join',
    'right join',
    'inner join',
    'group by',
    'order by',
    'limit',
    'having',
    'with',
  ];
  let formatted = sql.replace(/\s+/g, ' ').trim();
  for (const keyword of keywords) {
    const re = new RegExp(`\\b${keyword}\\b`, 'gi');
    formatted = formatted.replace(re, keyword.toUpperCase());
  }
  return formatted
    .replace(/\bFROM\b/g, '\nFROM')
    .replace(/\bWHERE\b/g, '\nWHERE')
    .replace(/\b(LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN)\b/g, '\n$1')
    .replace(/\bGROUP BY\b/g, '\nGROUP BY')
    .replace(/\bORDER BY\b/g, '\nORDER BY')
    .replace(/\bHAVING\b/g, '\nHAVING')
    .replace(/\bLIMIT\b/g, '\nLIMIT')
    .concat(';');
}

function quoteIdent(value: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error('Invalid schema or table identifier.');
  return `"${value.replace(/"/g, '""')}"`;
}

function toRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Prisma.InputJsonValue)
    : undefined;
}

function tableRef(schema: string, table: string) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

async function getMetadata() {
  const tables = await prisma.$queryRaw<TableRow[]>`
    SELECT
      t.table_schema,
      t.table_name,
      t.table_type,
      COUNT(c.column_name) AS column_count,
      COALESCE(MAX(cls.reltuples), 0)::bigint AS estimated_rows,
      COALESCE(pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)::regclass), 0)::bigint AS total_bytes
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c
      ON c.table_schema = t.table_schema
      AND c.table_name = t.table_name
    LEFT JOIN pg_class cls
      ON cls.relname = t.table_name
    LEFT JOIN pg_namespace nsp
      ON nsp.oid = cls.relnamespace
      AND nsp.nspname = t.table_schema
    WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
      AND t.table_type IN ('BASE TABLE', 'VIEW')
    GROUP BY t.table_schema, t.table_name, t.table_type
    ORDER BY t.table_schema, t.table_name
  `;

  const columns = await prisma.$queryRaw<ColumnRow[]>`
    SELECT table_schema, table_name, column_name, data_type, is_nullable, ordinal_position, column_default
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position
  `;

  const schemas = await prisma.$queryRaw<SchemaRow[]>`
    SELECT table_schema AS schema_name, COUNT(*) AS table_count
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type IN ('BASE TABLE', 'VIEW')
    GROUP BY table_schema
    ORDER BY table_schema
  `;

  const indexes = await prisma.$queryRaw<IndexRow[]>`
    SELECT schemaname AS schema_name, tablename AS table_name, indexname AS index_name, indexdef AS index_definition
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename, indexname
  `;

  const keys = await prisma.$queryRaw<KeyRow[]>`
    SELECT
      tc.table_schema AS schema_name,
      tc.table_name,
      kcu.column_name,
      tc.constraint_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
      AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
    ORDER BY tc.table_schema, tc.table_name, tc.constraint_type
  `;

  const relations = await prisma.$queryRaw<RelationRow[]>`
    SELECT
      tc.table_schema AS source_schema,
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY tc.table_schema, tc.table_name
  `;

  return { columns, indexes, keys, relations, schemas, tables };
}

async function getOverviewPayload() {
  const started = Date.now();
  const [health] = await prisma.$queryRaw<
    Array<{ ok: number; database_name: string; username: string; read_write: boolean; server_version: string }>
  >`
    SELECT
      1 AS ok,
      current_database() AS database_name,
      current_user AS username,
      NOT pg_is_in_recovery() AS read_write,
      current_setting('server_version') AS server_version
  `;
  const latencyMs = Date.now() - started;

  const metadata = await getMetadata();
  const tableCount = metadata.tables.length;
  const totalBytes = metadata.tables.reduce((sum, table) => sum + toNumber(table.total_bytes), 0);
  const totalColumns = metadata.tables.reduce((sum, table) => sum + toNumber(table.column_count), 0);
  const estimatedRows = metadata.tables.reduce((sum, table) => sum + toNumber(table.estimated_rows), 0);

  return {
    generatedAt: new Date().toISOString(),
    status: 'connected',
    syncStatus: 'Live',
    latencyMs,
    accessLevel: health.read_write ? 'Read/Write' : 'Read Only',
    connection: {
      id: 'primary-postgresql',
      name: 'Primary PostgreSQL',
      engine: 'PostgreSQL',
      database: health.database_name,
      user: health.username,
      serverVersion: health.server_version,
      url: maskDatabaseUrl(env.DATABASE_URL),
      queueBackend: env.QUEUE_BACKEND,
      status: 'Connected',
      isDefault: true,
    },
    summary: {
      tables: tableCount,
      schemas: metadata.schemas.length,
      connections: 1,
      savedQueries: savedQueries.length,
      queryHistory: queryHistory.length,
      totalColumns,
      estimatedRows,
      totalBytes,
    },
    schemas: metadata.schemas.map((schema) => ({
      name: schema.schema_name,
      tableCount: toNumber(schema.table_count),
    })),
    tables: metadata.tables.map((table) => ({
      schema: table.table_schema,
      name: table.table_name,
      type: table.table_type === 'VIEW' ? 'View' : 'Table',
      columns: toNumber(table.column_count),
      estimatedRows: toNumber(table.estimated_rows),
      totalBytes: toNumber(table.total_bytes),
    })),
    columns: metadata.columns,
    indexes: metadata.indexes,
    keys: metadata.keys,
    relations: metadata.relations,
    savedQueries,
    queryHistory,
    auditLogs: databaseAuditLogs,
  };
}

router.use(authenticate);

router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.json(await getOverviewPayload());
  }),
);

router.post(
  '/sync',
  asyncHandler(async (req, res) => {
    audit(req, 'SYNC_METADATA', 'primary-postgresql');
    res.json({
      ok: true,
      action: 'metadata_sync',
      ...(await getOverviewPayload()),
    });
  }),
);

router.post(
  '/connections/test',
  asyncHandler(async (req, res) => {
    const started = Date.now();
    const [result] = await prisma.$queryRaw<Array<{ ok: number; database_name: string }>>`
      SELECT 1 AS ok, current_database() AS database_name
    `;
    audit(req, 'TEST_CONNECTION', String(req.body?.name ?? 'Primary PostgreSQL'));
    res.json({
      ok: result.ok === 1,
      latencyMs: Date.now() - started,
      database: result.database_name,
      message: 'Connection test succeeded.',
    });
  }),
);

router.get(
  '/connections',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.databaseConnection.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        engine: true,
        host: true,
        port: true,
        databaseName: true,
        username: true,
        sourceType: true,
        sourceClass: true,
        environment: true,
        connectionMethod: true,
        authMethod: true,
        securityJson: true,
        discoveryJson: true,
        governanceJson: true,
        syncJson: true,
        qualityJson: true,
        researchJson: true,
        status: true,
        isDefault: true,
        createdAt: true,
      },
    });

    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        engine: row.engine,
        host: row.host,
        port: row.port,
        database: row.databaseName,
        username: row.username,
        sourceType: row.sourceType,
        sourceClass: row.sourceClass,
        environment: row.environment,
        connectionMethod: row.connectionMethod,
        authMethod: row.authMethod,
        security: row.securityJson,
        discovery: row.discoveryJson,
        governance: row.governanceJson,
        sync: row.syncJson,
        quality: row.qualityJson,
        research: row.researchJson,
        status: row.status,
        isDefault: row.isDefault,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  }),
);

router.post(
  '/connections',
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? '').trim() || 'Saved PostgreSQL Connection';
    const engine = String(req.body?.engine ?? 'PostgreSQL').trim() || 'PostgreSQL';
    const host = req.body?.host ? String(req.body.host).trim() : null;
    const databaseName =
      String(req.body?.databaseName ?? req.body?.database ?? '').trim() || 'health_data';
    const username = req.body?.username ? String(req.body.username).trim() : null;
    const connectionUrl = req.body?.connectionUrl ? String(req.body.connectionUrl).trim() : null;
    const isDefault = Boolean(req.body?.isDefault);
    const sourceType = req.body?.sourceType ? String(req.body.sourceType).trim() : null;
    const sourceClass = req.body?.sourceClass ? String(req.body.sourceClass).trim() : null;
    const environment = req.body?.environment ? String(req.body.environment).trim() : null;
    const connectionMethod = req.body?.connectionMethod
      ? String(req.body.connectionMethod).trim()
      : null;
    const authMethod = req.body?.authMethod ? String(req.body.authMethod).trim() : null;
    const securityJson = toRecord(req.body?.security);
    const discoveryJson = toRecord(req.body?.discovery);
    const governanceJson = toRecord(req.body?.governance);
    const syncJson = toRecord(req.body?.sync);
    const qualityJson = toRecord(req.body?.quality);
    const researchJson = toRecord(req.body?.research);
    const parsedPort = Number(req.body?.port);
    const port = Number.isFinite(parsedPort) && parsedPort > 0 ? Math.round(parsedPort) : null;

    if (isDefault) {
      await prisma.databaseConnection.updateMany({ data: { isDefault: false } });
    }

    const created = await prisma.databaseConnection.create({
      data: {
        name,
        engine,
        host,
        port,
        databaseName,
        username,
        connectionUrl,
        sourceType,
        sourceClass,
        environment,
        connectionMethod,
        authMethod,
        securityJson,
        discoveryJson,
        governanceJson,
        syncJson,
        qualityJson,
        researchJson,
        status: 'saved',
        isDefault,
      },
      select: {
        id: true,
        name: true,
        engine: true,
        host: true,
        port: true,
        databaseName: true,
        username: true,
        sourceType: true,
        sourceClass: true,
        environment: true,
        connectionMethod: true,
        authMethod: true,
        securityJson: true,
        discoveryJson: true,
        governanceJson: true,
        syncJson: true,
        qualityJson: true,
        researchJson: true,
        status: true,
        isDefault: true,
        createdAt: true,
      },
    });

    audit(req, 'SAVE_CONNECTION', created.name);
    res.status(201).json({
      id: created.id,
      name: created.name,
      engine: created.engine,
      host: created.host,
      port: created.port,
      database: created.databaseName,
      username: created.username,
      sourceType: created.sourceType,
      sourceClass: created.sourceClass,
      environment: created.environment,
      connectionMethod: created.connectionMethod,
      authMethod: created.authMethod,
      security: created.securityJson,
      discovery: created.discoveryJson,
      governance: created.governanceJson,
      sync: created.syncJson,
      quality: created.qualityJson,
      research: created.researchJson,
      status: created.status,
      isDefault: created.isDefault,
      createdAt: created.createdAt.toISOString(),
    });
  }),
);

router.patch(
  '/connections/:id/default',
  asyncHandler(async (req, res) => {
    audit(req, 'SET_DEFAULT_CONNECTION', req.params.id);
    res.json({ ok: true, id: req.params.id, isDefault: true });
  }),
);

router.delete(
  '/connections/:id',
  asyncHandler(async (req, res) => {
    audit(req, 'DELETE_CONNECTION', req.params.id);
    res.json({ ok: true, id: req.params.id });
  }),
);

router.post(
  '/query/format',
  asyncHandler(async (req, res) => {
    const sql = normalizeSql(req.body?.sql);
    validateReadOnlySql(sql);
    audit(req, 'FORMAT_SQL', 'query-studio');
    res.json({ sql: formatSql(sql) });
  }),
);

router.post(
  '/query/run',
  asyncHandler(async (req, res) => {
    const sql = limitSql(normalizeSql(req.body?.sql));
    validateReadOnlySql(sql);
    const started = Date.now();
    try {
      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql);
      const item: QueryHistoryItem = {
        id: randomUUID(),
        sql,
        status: 'SUCCEEDED',
        rowCount: rows.length,
        executionMs: Date.now() - started,
        createdAt: new Date().toISOString(),
      };
      queryHistory.unshift(item);
      queryHistory.splice(50);
      audit(req, 'RUN_QUERY', item.id);
      res.json({
        queryId: item.id,
        sql,
        columns: rows[0] ? Object.keys(rows[0]) : [],
        rows: serializeRows(rows),
        rowCount: rows.length,
        executionMs: item.executionMs,
      });
    } catch (error) {
      const item: QueryHistoryItem = {
        id: randomUUID(),
        sql,
        status: 'FAILED',
        rowCount: 0,
        executionMs: Date.now() - started,
        createdAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Query failed.',
      };
      queryHistory.unshift(item);
      throw error;
    }
  }),
);

router.post(
  '/query/explain',
  asyncHandler(async (req, res) => {
    const sql = normalizeSql(req.body?.sql);
    validateReadOnlySql(sql);
    const explainedSql = /^explain\b/i.test(sql) ? sql : `EXPLAIN (FORMAT JSON) ${sql}`;
    const started = Date.now();
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(explainedSql);
    audit(req, 'EXPLAIN_QUERY', 'query-studio');
    res.json({
      sql: explainedSql,
      plan: serializeRows(rows),
      executionMs: Date.now() - started,
    });
  }),
);

router.post(
  '/query/save',
  asyncHandler(async (req, res) => {
    const sql = normalizeSql(req.body?.sql);
    validateReadOnlySql(sql);
    const saved: SavedQuery = {
      id: randomUUID(),
      name: String(req.body?.name ?? `Saved query ${savedQueries.length + 1}`),
      sql: `${sql};`,
      createdAt: new Date().toISOString(),
    };
    savedQueries.unshift(saved);
    savedQueries.splice(30);
    audit(req, 'SAVE_QUERY', saved.name);
    res.status(201).json(saved);
  }),
);

router.get(
  '/query/history',
  asyncHandler(async (_req, res) => {
    res.json({ history: queryHistory, savedQueries });
  }),
);

router.get(
  '/tables/:schema/:table/preview',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 25), 1), 200);
    const sql = `SELECT * FROM ${tableRef(req.params.schema, req.params.table)} LIMIT ${limit}`;
    const started = Date.now();
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql);
    res.json({
      schema: req.params.schema,
      table: req.params.table,
      columns: rows[0] ? Object.keys(rows[0]) : [],
      rows: serializeRows(rows),
      rowCount: rows.length,
      executionMs: Date.now() - started,
    });
  }),
);

router.get(
  '/tables/:schema/:table/profile',
  asyncHandler(async (req, res) => {
    const ref = tableRef(req.params.schema, req.params.table);
    const columns = await prisma.$queryRaw<ColumnRow[]>`
      SELECT table_schema, table_name, column_name, data_type, is_nullable, ordinal_position, column_default
      FROM information_schema.columns
      WHERE table_schema = ${req.params.schema}
        AND table_name = ${req.params.table}
      ORDER BY ordinal_position
    `;
    const [{ row_count: rowCountRaw }] = await prisma.$queryRawUnsafe<Array<{ row_count: bigint }>>(
      `SELECT COUNT(*)::bigint AS row_count FROM ${ref}`,
    );
    const rowCount = toNumber(rowCountRaw);
    const profiles = [];
    for (const column of columns.slice(0, 40)) {
      const col = quoteIdent(column.column_name);
      const [profile] = await prisma.$queryRawUnsafe<
        Array<{ null_count: bigint; distinct_count: bigint; sample_value: unknown }>
      >(`SELECT COUNT(*) FILTER (WHERE ${col} IS NULL)::bigint AS null_count,
                COUNT(DISTINCT ${col})::bigint AS distinct_count,
                MIN(${col}::text) AS sample_value
         FROM ${ref}`);
      profiles.push({
        column: column.column_name,
        dataType: column.data_type,
        nullable: column.is_nullable === 'YES',
        nullCount: toNumber(profile.null_count),
        missingness: rowCount ? Number((toNumber(profile.null_count) / rowCount).toFixed(4)) : 0,
        distinctCount: toNumber(profile.distinct_count),
        sampleValue: serializeValue(profile.sample_value),
      });
    }
    res.json({ schema: req.params.schema, table: req.params.table, rowCount, profiles });
  }),
);

router.post(
  '/datasets/build',
  asyncHandler(async (req, res) => {
    const sourceType = req.body?.sourceType === 'table' ? 'table' : 'sql';
    const datasetId = `dataset-build-${randomUUID()}`;
    audit(req, 'CREATE_DATASET_BUILD', String(req.body?.name ?? datasetId));
    res.status(201).json({
      id: datasetId,
      name: req.body?.name ?? 'Database Studio Dataset',
      sourceType,
      source: sourceType === 'table' ? req.body?.table : normalizeSql(req.body?.sql),
      variables: Array.isArray(req.body?.variables) ? req.body.variables : [],
      version: 1,
      status: 'ANALYSIS_READY',
      lineage: ['database_connection', sourceType, 'dataset_build', 'analytics_ready'],
      createdAt: new Date().toISOString(),
    });
  }),
);

router.post(
  '/cohorts/preview',
  asyncHandler(async (req, res) => {
    const sourceSql = normalizeSql(req.body?.sql || 'SELECT * FROM sdoh_patients');
    validateReadOnlySql(sourceSql);
    const filter = String(req.body?.filter ?? 'TRUE').trim() || 'TRUE';
    if (/[;]|--|\/\*/.test(filter)) throw new Error('Invalid cohort filter.');
    const sql = `SELECT * FROM (${limitSql(sourceSql)}) studio_source WHERE ${filter} LIMIT 50`;
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql);
    audit(req, 'PREVIEW_COHORT', 'database-studio');
    res.json({
      cohortId: `cohort-${randomUUID()}`,
      filter,
      eligibleRows: rows.length,
      rows: serializeRows(rows),
      columns: rows[0] ? Object.keys(rows[0]) : [],
    });
  }),
);

router.post(
  '/analytics/handoff',
  asyncHandler(async (req, res) => {
    const target = String(req.body?.target ?? 'descriptive').toLowerCase();
    const allowed = ['descriptive', 'regression', 'classification', 'survival', 'sem', 'visualization'];
    if (!allowed.includes(target)) throw new Error('Unsupported analytics handoff target.');
    audit(req, 'SEND_TO_ANALYTICS', target);
    res.status(202).json({
      ok: true,
      target,
      handoffId: `handoff-${randomUUID()}`,
      status: 'QUEUED_FOR_ANALYTICS',
      route: target === 'visualization' ? '/dashboard/visualizations' : '/dashboard/sdoh',
      message: `Dataset is ready for ${target} analytics.`,
    });
  }),
);

router.get(
  '/governance',
  asyncHandler(async (_req, res) => {
    res.json({
      rbac: {
        accessLevel: 'Read/Write',
        allowedActions: ['read_metadata', 'run_read_query', 'build_dataset', 'send_to_analytics'],
        restrictedActions: ['write_sql', 'ddl', 'delete_source_data'],
      },
      phiPii: {
        warning: true,
        message: 'PHI/PII review is required before publication export or external sharing.',
      },
      approvals: [
        { stage: 'Dataset approval', required: true, status: 'Ready for review' },
        { stage: 'Publication approval', required: true, status: 'Required before release' },
      ],
      auditLogs: databaseAuditLogs,
    });
  }),
);

export default router;
