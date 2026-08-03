import { getPostgresPool, getSqliteClient, databaseProvider } from "@/db";
import { generateSpecKitWithAiFallback } from "./ai-generation";
import type { ProjectInputs, ProjectRecord, SpecKitArtifacts } from "./types";

interface ProjectRow {
  id: number;
  name: string;
  one_liner: string;
  spectrum_position: string;
  preferred_agent: string;
  app_type: string;
  inputs: string | Record<string, unknown>;
  artifacts: string | Record<string, unknown>;
  version: number;
  is_favorite: boolean | number;
  created_at: string | Date;
  updated_at: string | Date;
}

function parseJsonField<T>(value: string | Record<string, unknown>): T {
  return typeof value === "string" ? JSON.parse(value) as T : value as T;
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    oneLiner: row.one_liner,
    spectrumPosition: row.spectrum_position as ProjectRecord["spectrumPosition"],
    preferredAgent: row.preferred_agent as ProjectRecord["preferredAgent"],
    appType: row.app_type as ProjectRecord["appType"],
    inputs: parseJsonField<ProjectInputs>(row.inputs),
    artifacts: parseJsonField<SpecKitArtifacts>(row.artifacts),
    version: row.version,
    isFavorite: Boolean(row.is_favorite),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export interface ListProjectsOptions {
  search?: string;
  appType?: string;
  spectrumPosition?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}

function buildSqliteFilters(options: ListProjectsOptions) {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (options.search) {
    clauses.push("(lower(name) LIKE ? OR lower(one_liner) LIKE ?)");
    const search = `%${options.search.toLowerCase()}%`;
    params.push(search, search);
  }

  if (options.appType) {
    clauses.push("app_type = ?");
    params.push(options.appType);
  }

  if (options.spectrumPosition) {
    clauses.push("spectrum_position = ?");
    params.push(options.spectrumPosition);
  }

  if (options.favoritesOnly) {
    clauses.push("is_favorite = 1");
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function buildPostgresFilters(options: ListProjectsOptions) {
  const clauses: string[] = [];
  const params: (string | boolean)[] = [];

  if (options.search) {
    params.push(`%${options.search}%`);
    clauses.push(`(name ILIKE $${params.length} OR one_liner ILIKE $${params.length})`);
  }

  if (options.appType) {
    params.push(options.appType);
    clauses.push(`app_type = $${params.length}`);
  }

  if (options.spectrumPosition) {
    params.push(options.spectrumPosition);
    clauses.push(`spectrum_position = $${params.length}`);
  }

  if (options.favoritesOnly) {
    params.push(true);
    clauses.push(`is_favorite = $${params.length}`);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export async function listProjects(options: ListProjectsOptions = {}): Promise<{
  items: ProjectRecord[];
  total: number;
}> {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  if (databaseProvider === "sqlite") {
    const db = getSqliteClient();
    const { whereSql, params } = buildSqliteFilters(options);
    const countRow = db.prepare(`SELECT count(*) as count FROM projects ${whereSql}`).get(...params) as { count: number };
    const rows = db
      .prepare(`
        SELECT * FROM projects
        ${whereSql}
        ORDER BY is_favorite DESC, updated_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, limit, offset) as ProjectRow[];

    return { items: rows.map(toRecord), total: countRow.count ?? 0 };
  }

  const pool = getPostgresPool();
  const { whereSql, params } = buildPostgresFilters(options);
  const countResult = await pool.query<{ count: string }>(`SELECT count(*)::int as count FROM projects ${whereSql}`, params);
  const rowsResult = await pool.query<ProjectRow>(
    `
      SELECT * FROM projects
      ${whereSql}
      ORDER BY is_favorite DESC, updated_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
    [...params, limit, offset]
  );

  return {
    items: rowsResult.rows.map(toRecord),
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function getProject(id: number): Promise<ProjectRecord | null> {
  if (databaseProvider === "sqlite") {
    const row = getSqliteClient().prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").get(id) as ProjectRow | undefined;
    return row ? toRecord(row) : null;
  }

  const result = await getPostgresPool().query<ProjectRow>("SELECT * FROM projects WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function createProject(inputs: ProjectInputs): Promise<ProjectRecord> {
  const artifacts = await generateSpecKitWithAiFallback(inputs);

  if (databaseProvider === "sqlite") {
    const db = getSqliteClient();
    const result = db.prepare(`
      INSERT INTO projects (name, one_liner, spectrum_position, preferred_agent, app_type, inputs, artifacts, version, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
    `).run(
      inputs.projectName,
      inputs.oneLiner,
      inputs.spectrumPosition,
      inputs.preferredAgent,
      inputs.appType,
      JSON.stringify(inputs),
      JSON.stringify(artifacts)
    );
    const created = await getProject(Number(result.lastInsertRowid));
    if (!created) throw new Error("Failed to load created project");
    return created;
  }

  const result = await getPostgresPool().query<ProjectRow>(
    `
      INSERT INTO projects (name, one_liner, spectrum_position, preferred_agent, app_type, inputs, artifacts, version, is_favorite)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 1, false)
      RETURNING *
    `,
    [
      inputs.projectName,
      inputs.oneLiner,
      inputs.spectrumPosition,
      inputs.preferredAgent,
      inputs.appType,
      JSON.stringify(inputs),
      JSON.stringify(artifacts),
    ]
  );
  return toRecord(result.rows[0]);
}

export async function regenerateProject(id: number, inputs: ProjectInputs): Promise<ProjectRecord | null> {
  const existing = await getProject(id);
  if (!existing) return null;
  const artifacts = await generateSpecKitWithAiFallback(inputs);

  if (databaseProvider === "sqlite") {
    getSqliteClient().prepare(`
      UPDATE projects
      SET name = ?, one_liner = ?, spectrum_position = ?, preferred_agent = ?, app_type = ?,
          inputs = ?, artifacts = ?, version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      inputs.projectName,
      inputs.oneLiner,
      inputs.spectrumPosition,
      inputs.preferredAgent,
      inputs.appType,
      JSON.stringify(inputs),
      JSON.stringify(artifacts),
      existing.version + 1,
      id
    );
    return getProject(id);
  }

  const result = await getPostgresPool().query<ProjectRow>(
    `
      UPDATE projects
      SET name = $1, one_liner = $2, spectrum_position = $3, preferred_agent = $4, app_type = $5,
          inputs = $6::jsonb, artifacts = $7::jsonb, version = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `,
    [
      inputs.projectName,
      inputs.oneLiner,
      inputs.spectrumPosition,
      inputs.preferredAgent,
      inputs.appType,
      JSON.stringify(inputs),
      JSON.stringify(artifacts),
      existing.version + 1,
      id,
    ]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function toggleFavorite(id: number): Promise<ProjectRecord | null> {
  const existing = await getProject(id);
  if (!existing) return null;

  if (databaseProvider === "sqlite") {
    getSqliteClient()
      .prepare("UPDATE projects SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(existing.isFavorite ? 0 : 1, id);
    return getProject(id);
  }

  const result = await getPostgresPool().query<ProjectRow>(
    "UPDATE projects SET is_favorite = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [!existing.isFavorite, id]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function deleteProject(id: number): Promise<boolean> {
  if (databaseProvider === "sqlite") {
    const result = getSqliteClient().prepare("DELETE FROM projects WHERE id = ?").run(id);
    return result.changes > 0;
  }

  const result = await getPostgresPool().query("DELETE FROM projects WHERE id = $1 RETURNING id", [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getProjectStats(): Promise<{
  total: number;
  byAppType: Record<string, number>;
  bySpectrum: Record<string, number>;
  favorites: number;
  thisWeek: number;
}> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const rows = databaseProvider === "sqlite"
    ? getSqliteClient().prepare("SELECT * FROM projects").all() as ProjectRow[]
    : (await getPostgresPool().query<ProjectRow>("SELECT * FROM projects")).rows;

  const byAppType: Record<string, number> = {};
  const bySpectrum: Record<string, number> = {};
  let favorites = 0;
  let thisWeek = 0;

  for (const project of rows) {
    byAppType[project.app_type] = (byAppType[project.app_type] || 0) + 1;
    bySpectrum[project.spectrum_position] = (bySpectrum[project.spectrum_position] || 0) + 1;
    if (Boolean(project.is_favorite)) favorites++;
    if (new Date(project.created_at) >= oneWeekAgo) thisWeek++;
  }

  return {
    total: rows.length,
    byAppType,
    bySpectrum,
    favorites,
    thisWeek,
  };
}
