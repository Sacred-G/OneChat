import { listSkills } from "@/lib/skills-registry";

export async function GET() {
  try {
    const skills = await listSkills();
    return new Response(JSON.stringify({ skills }), { status: 200 });
  } catch (e) {
    console.error("Failed to list skills", e);
    return new Response("Failed to list skills", { status: 500 });
  }
}
