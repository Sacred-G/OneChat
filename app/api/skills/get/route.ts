import { getSkill } from "@/lib/skills-registry";

export async function POST(request: Request) {
  const { skillName } = await request.json();

  if (!skillName || typeof skillName !== "string") {
    return new Response(JSON.stringify({ skill: null }), { status: 200 });
  }

  try {
    const skill = await getSkill(skillName);
    if (!skill) {
      return new Response("Unknown skill", { status: 400 });
    }
    return new Response(
      JSON.stringify({
        skill: {
          name: skill.name,
          description: skill.description,
          content: skill.content,
        },
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Failed to read skill file", e);
    return new Response("Failed to load skill", { status: 500 });
  }
}
