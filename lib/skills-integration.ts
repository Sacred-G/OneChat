/**
 * Skills Integration System
 * 
 * This module provides integration with Claude-style skills for enhanced AI capabilities.
 * Skills are loaded from the /skills directory and can be used to guide the AI's behavior.
 */

export interface Skill {
  name: string;
  description: string;
  content: string;
  license?: string;
}

/**
 * Available skills in the system
 */
export const AVAILABLE_SKILLS = {
  "web-artifacts-builder": {
    name: "web-artifacts-builder",
    description: "Suite of tools for creating elaborate, multi-component HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components.",
    path: "/skills/web-artifacts-builder/SKILL.md"
  },
  "frontend-design": {
    name: "frontend-design",
    description: "Create distinctive, production-grade frontend interfaces with high design quality. Use when building web components, pages, artifacts, or applications. Generates creative, polished code and UI design that avoids generic AI aesthetics.",
    path: "/skills/frontend-design/SKILL.md"
  }
};

/**
 * System prompt enhancement with skills
 */
export const SKILLS_SYSTEM_PROMPT = `
# Available Skills

You have access to the following skills that enhance your capabilities:

## Web Artifacts Builder
Create elaborate, multi-component HTML artifacts using React, Tailwind CSS, and shadcn/ui. When creating HTML or React artifacts:
- Use modern frontend technologies
- Create self-contained, production-ready code
- Include all necessary imports and dependencies
- Wrap artifacts in proper HTML structure
- Use Tailwind CSS for styling
- Follow best practices for component design

## Frontend Design
Create distinctive, production-grade frontend interfaces with exceptional design quality:
- Choose bold, intentional aesthetic directions
- Use distinctive typography (avoid generic fonts like Inter, Arial)
- Create cohesive color schemes with CSS variables
- Add meaningful animations and micro-interactions
- Design unexpected, memorable layouts
- Avoid generic "AI slop" aesthetics (purple gradients, centered layouts, uniform rounded corners)

# Artifact Creation Guidelines

When creating code artifacts (HTML, React, or other web content):

1. **Mark artifacts clearly**: Use code blocks with appropriate language tags
2. **Make them self-contained**: Include all necessary HTML, CSS, and JavaScript
3. **Prefer TypeScript app artifacts for React UIs**: Use the create_ts_app tool for interactive or multi-file React apps, with JSON keys entry, files, and optional dependencies.
4. **Use modern stack**: React 18, Tailwind CSS, modern ES6+ JavaScript
5. **Be production-ready**: Include proper error handling, accessibility, responsive design
6. **Follow design principles**: Create visually striking, memorable interfaces

Example artifact structure:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifact Title</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <!-- Your creative, well-designed content here -->
</body>
</html>
\`\`\`

The system will automatically detect and render these artifacts in a dedicated viewer panel.
`;

/**
 * Get the enhanced system prompt with skills
 */
export function getSkillsEnhancedPrompt(): string {
  return SKILLS_SYSTEM_PROMPT;
}

/**
 * Check if a skill is available
 */
export function isSkillAvailable(skillName: string): boolean {
  return skillName in AVAILABLE_SKILLS;
}

/**
 * Get skill metadata
 */
export function getSkillMetadata(skillName: string) {
  return AVAILABLE_SKILLS[skillName as keyof typeof AVAILABLE_SKILLS];
}
