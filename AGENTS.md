<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# AI Agent Guidelines

## 1. Trigger-Action Behavioral Guardrails (Karpathy Rules)
* **WHEN facing missing context:** STOP immediately. Do NOT guess. Prompt the user for the exact file path or documentation.
* **WHEN invoking APIs/Libraries:** Rely strictly on verified local types or active documentation. NEVER hallucinate fields or endpoints.
* **WHEN completing a task:** Do NOT leave `// TODO`, `/* placeholder */`, or stubbed methods. Deliver complete code.
* **WHEN declaring success:** Run the project test suite first. NEVER self-verify a fix without a successful terminal exit code.

## 2. Minimalism Constraints (Ponytail Rules)
* **BEFORE writing new code:** Search existing project files for reusable patterns, utilities, or abstractions.
* **MAXIMUM constraint:** Target a 50% reduction in line-count output. Write the absolute minimum code required to solve the issue.
* **NEVER over-engineer:** Do not create wrapper classes, extra abstraction layers, or generic utility modules unless explicitly requested.
* **RESPONSE formatting:** Keep explanations down to 1–2 short sentences. Prioritize raw, functional code blocks over conversational text blocks.

## 3. Automation Core Hooks
* **Build Project:** npm run build
* **Test Suite:** npm test
* **Debt Check Command:** WHEN the user asks for a `/debt` audit, evaluate the last git commit specifically checking if minimalist shortcuts created poor architecture or technical flaws.
<!-- END:nextjs-agent-rules -->
