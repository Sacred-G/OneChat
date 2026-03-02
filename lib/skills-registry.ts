import "server-only";

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export type SkillMeta = {
  name: string;
  description: string;
  license?: string;
  path: string;
};

type SkillFrontmatter = {
  name?: string;
  description?: string;
  license?: string;
};

const SKILL_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedSkillList = {
  skills: SkillMeta[];
  byName: Map<string, SkillMeta>;
  byLowerName: Map<string, SkillMeta>;
  byCanonicalName: Map<string, SkillMeta>;
  expiresAt: number;
};

type CachedSkillPayload = {
  name: string;
  description: string;
  content: string;
};

type CachedSkillEntry = CachedSkillPayload & {
  expiresAt: number;
};

let cachedSkillList: CachedSkillList | null = null;
let skillListLoadPromise: Promise<CachedSkillList | null> | null = null;
const skillContentCache = new Map<string, CachedSkillEntry>();
const skillContentLoadPromise = new Map<string, Promise<CachedSkillPayload | null>>();

function canonicalizeSkillName(skillName: string) {
  return skillName
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatter(md: string): SkillFrontmatter {
  const trimmed = md.trimStart();
  if (!trimmed.startsWith("---")) return {};

  const endIdx = trimmed.indexOf("\n---", 3);
  if (endIdx === -1) return {};

  const block = trimmed.slice(3, endIdx).trim();
  const lines = block.split(/\r?\n/);

  const out: SkillFrontmatter = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!value) continue;

    if (key === "name") out.name = value;
    if (key === "description") out.description = value;
    if (key === "license") out.license = value;
  }

  return out;
}

async function existsFile(p: string) {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function loadSkillsFromDisk(): Promise<SkillMeta[]> {
  const candidates: Array<{ absRoot: string; relRoot: string }> = [
    // App-local skills directory
    { absRoot: path.join(process.cwd(), "skills"), relRoot: "skills" },
    // Repo-root skills library (common layout in this repo)
    {
      absRoot: path.join(process.cwd(), "..", "skills", "skills"),
      relRoot: path.join("..", "skills", "skills"),
    },
  ];

  const skillsByName = new Map<string, SkillMeta>();

  for (const { absRoot, relRoot } of candidates) {
    let dirents: Awaited<ReturnType<typeof readdir>>;
    try {
      dirents = await readdir(absRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const d of dirents) {
      if (!d.isDirectory()) continue;
      const dirName = d.name;
      const relSkillPath = path.join(relRoot, dirName, "SKILL.md");
      const absSkillPath = path.join(process.cwd(), relSkillPath);

      if (!(await existsFile(absSkillPath))) continue;

      let content = "";
      try {
        content = await readFile(absSkillPath, "utf8");
      } catch {
        continue;
      }

      const fm = parseFrontmatter(content);

      const name = fm.name || dirName;
      const description = fm.description || "";
      const license = fm.license;

      if (!skillsByName.has(name)) {
        skillsByName.set(name, {
          name,
          description,
          license,
          path: `/${relSkillPath.replace(/\\/g, "/")}`,
        });
      }
    }
  }

  const skills = Array.from(skillsByName.values());
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

async function getCachedSkillsList(): Promise<CachedSkillList> {
  const now = Date.now();

  if (cachedSkillList && cachedSkillList.expiresAt > now) {
    return cachedSkillList;
  }

  if (skillListLoadPromise) {
    const loaded = await skillListLoadPromise;
    return (
      loaded ?? {
        skills: [],
        byName: new Map(),
        byLowerName: new Map(),
        expiresAt: now,
      }
    );
  }

  skillListLoadPromise = (async () => {
    try {
      const skills = await loadSkillsFromDisk();
      const byName = new Map<string, SkillMeta>();
      const byLowerName = new Map<string, SkillMeta>();
      const byCanonicalName = new Map<string, SkillMeta>();
      for (const skill of skills) {
        byName.set(skill.name, skill);
        byLowerName.set(skill.name.toLowerCase(), skill);
        byCanonicalName.set(canonicalizeSkillName(skill.name), skill);
      }
      const next: CachedSkillList = {
        skills,
        byName,
        byLowerName,
        byCanonicalName,
        expiresAt: Date.now() + SKILL_CACHE_TTL_MS,
      };
      cachedSkillList = next;
      return next;
    } catch {
      return null;
    } finally {
      skillListLoadPromise = null;
    }
  })();

  const loaded = await skillListLoadPromise;
  return (
      loaded ?? {
        skills: [],
        byName: new Map(),
        byLowerName: new Map(),
        byCanonicalName: new Map(),
        expiresAt: now,
      }
  );
}

function toSkillCacheKey(skillName: string) {
  return skillName.trim().toLowerCase();
}

export async function listSkills(): Promise<SkillMeta[]> {
  const cached = await getCachedSkillsList();
  return cached.skills;
}

export async function getSkillMeta(skillName: string): Promise<SkillMeta | null> {
  const normalized = skillName?.trim();
  if (!normalized) return null;
  const cached = await getCachedSkillsList();
  return (
    cached.byName.get(normalized) ||
    cached.byLowerName.get(normalized.toLowerCase()) ||
    cached.byCanonicalName.get(canonicalizeSkillName(normalized)) ||
    null
  );
}

export async function getSkill(skillName: string) {
  const normalized = typeof skillName === "string" ? skillName.trim() : "";
  if (!normalized) return null;

  const cacheKey = toSkillCacheKey(normalized);
  const now = Date.now();
  const cached = skillContentCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      name: cached.name,
      description: cached.description,
      content: cached.content,
    };
  }

  const inFlight = skillContentLoadPromise.get(cacheKey);
  if (inFlight) {
    return await inFlight;
  }

  const loadPromise = (async () => {
    try {
      const meta = await getSkillMeta(normalized);
      if (!meta) return null;

      const rel = String(meta.path || "").replace(/^\//, "");
      const abs = path.join(process.cwd(), rel);
      const content = await readFile(abs, "utf8");
      const payload = {
        name: meta.name,
        description: meta.description,
        content,
      };

      skillContentCache.set(cacheKey, {
        ...payload,
        expiresAt: Date.now() + SKILL_CACHE_TTL_MS,
      });

      return payload;
    } catch {
      return null;
    } finally {
      skillContentLoadPromise.delete(cacheKey);
    }
  })();

  skillContentLoadPromise.set(cacheKey, loadPromise);
  return await loadPromise;
}
