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

export async function listSkills(): Promise<SkillMeta[]> {
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

export async function getSkillMeta(skillName: string): Promise<SkillMeta | null> {
  const skills = await listSkills();
  return skills.find((s) => s.name === skillName) ?? null;
}

export async function getSkill(skillName: string) {
  const meta = await getSkillMeta(skillName);
  if (!meta) return null;

  const rel = String(meta.path || "").replace(/^\//, "");
  const abs = path.join(process.cwd(), rel);

  const content = await readFile(abs, "utf8");
  return {
    name: meta.name,
    description: meta.description,
    content,
  };
}
