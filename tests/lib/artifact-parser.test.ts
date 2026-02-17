import { extractArtifacts, hasArtifacts } from '@/lib/artifact-parser'

describe('Artifact Parser', () => {
  describe('extractArtifacts', () => {
    it('should return empty artifacts for plain text', () => {
      const content = 'This is just plain text with no code blocks.'
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(0)
      expect(result.cleanedContent).toBe(content)
    })

    it('should extract HTML artifacts', () => {
      const content = 'Here is an HTML page:\n\n```html\n<!DOCTYPE html>\n<html><body>Hello</body></html>\n```'
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(1)
      expect(result.artifacts[0].type).toBe('html')
      expect(result.artifacts[0].language).toBe('html')
      expect(result.artifacts[0].code).toContain('<!DOCTYPE html>')
      expect(result.artifacts[0].title).toBe('Artifact 1')
    })

    it('should extract React artifacts', () => {
      const content = 'Here is a React component:\n\n```jsx\nimport React from "react"\nexport default function App() {\n  return <div>Hello</div>\n}\n```'
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(1)
      expect(result.artifacts[0].type).toBe('react')
      expect(result.artifacts[0].language).toBe('jsx')
      expect(result.artifacts[0].code).toContain('import React')
    })

    it('should extract TypeScript app artifacts', () => {
      const content = '```ts_app\n{"files": {"index.tsx": "console.log(\'hello\')"}}\n```'
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(1)
      expect(result.artifacts[0].type).toBe('ts_app')
      expect(result.artifacts[0].language).toBe('ts_app')
    })

    it('should extract plain code artifacts', () => {
      const content = 'Here is some Python code:\n\n```python\nprint("Hello, World!")\n```'
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(1)
      expect(result.artifacts[0].type).toBe('code')
      expect(result.artifacts[0].language).toBe('python')
      expect(result.artifacts[0].title).toBe('Code 1')
    })

    it('should extract artifacts with metadata', () => {
      const content = '```html\n// artifact: My Custom App\n<!DOCTYPE html>\n<html><body>Custom</body></html>\n```'
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(1)
      expect(result.artifacts[0].title).toBe('My Custom App')
    })

    it('should extract multiple artifacts', () => {
      const content = `
        First artifact:
        \`\`\`html
        <div>HTML content</div>
        \`\`\`
        
        Second artifact:
        \`\`\`python
        print("Python code")
        \`\`\`
      `
      const result = extractArtifacts(content)
      
      expect(result.artifacts).toHaveLength(2)
      expect(result.artifacts[0].type).toBe('html')
      expect(result.artifacts[1].type).toBe('code')
      expect(result.artifacts[1].language).toBe('python')
    })

    it('should wrap HTML fragments in complete document', () => {
      const content = '```html\n<div>Just a fragment</div>\n```'
      const result = extractArtifacts(content)
      
      expect(result.artifacts[0].code).toContain('<!DOCTYPE html>')
      expect(result.artifacts[0].code).toContain('<html')
      expect(result.artifacts[0].code).toContain('<body>')
      expect(result.artifacts[0].code).toContain('<div>Just a fragment</div>')
    })

    it('should handle empty code blocks', () => {
      const content = 'Empty block:\n\n```\n\n```'
      const result = extractArtifacts(content)
      
      // Empty code blocks are not processed as artifacts
      expect(result.artifacts).toHaveLength(0)
    })
  })

  describe('hasArtifacts', () => {
    it('should return false for plain text', () => {
      expect(hasArtifacts('This is plain text')).toBe(false)
    })

    it('should return true for content with code blocks', () => {
      expect(hasArtifacts('Here is a code block: ```js console.log("test") ```')).toBe(true)
    })

    it('should return true for empty code blocks', () => {
      expect(hasArtifacts('Empty: ```\n\n```')).toBe(true)
    })
  })
})
