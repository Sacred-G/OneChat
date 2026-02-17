import "server-only";

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

async function existsFile(p: string) {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function existsDir(p: string) {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}


export async function POST(request: Request) {
  try {
    const { skillName, referencePath } = await request.json();

    if (!skillName || typeof skillName !== "string") {
      return new Response(JSON.stringify({ error: "Missing skillName" }), { status: 400 });
    }

    // Find the skill directory
    const skillDir = path.join(process.cwd(), "skills", skillName);
    
    if (!(await existsDir(skillDir))) {
      return new Response(JSON.stringify({ error: "Skill not found" }), { status: 404 });
    }

    // If no referencePath provided, list available references
    if (!referencePath || typeof referencePath !== "string") {
      const referencesDir = path.join(skillDir, "references");
      
      if (!(await existsDir(referencesDir))) {
        return new Response(JSON.stringify({ 
          files: [],
          message: "No references directory found for this skill"
        }), { status: 200 });
      }

      try {
        const entries = await readdir(referencesDir, { withFileTypes: true });
        const files = entries
          .filter(e => e.isFile() && (e.name.endsWith(".md") || e.name.endsWith(".txt")))
          .map(e => e.name);
        
        return new Response(JSON.stringify({ files }), { status: 200 });
      } catch {
        return new Response(JSON.stringify({ files: [] }), { status: 200 });
      }
    }

    // Sanitize the reference path to prevent directory traversal
    const sanitizedPath = path.basename(referencePath);
    const fullPath = path.join(skillDir, "references", sanitizedPath);

    // Ensure the path is within the skill's references directory
    const referencesDir = path.join(skillDir, "references");
    if (!fullPath.startsWith(referencesDir)) {
      return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400 });
    }

    if (!(await existsFile(fullPath))) {
      return new Response(JSON.stringify({ error: "Reference file not found" }), { status: 404 });
    }

    const content = await readFile(fullPath, "utf8");
    
    return new Response(JSON.stringify({ 
      filename: sanitizedPath,
      content 
    }), { status: 200 });

  } catch (e) {
    console.error("Failed to read skill reference", e);
    return new Response(JSON.stringify({ error: "Failed to load reference" }), { status: 500 });
  }
}
