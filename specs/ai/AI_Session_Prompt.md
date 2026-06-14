Read these files first:

1. specs/ai/AI_CONTEXT.md
2. specs/ai/AI_ARCHITECTURE.md
3. specs/ai/AI_SCHEMA.md
4. specs/ai/AI_API.md
5. specs/ai/AI_TASKS.md

Then inspect the existing codebase only as needed.

Rules:
- Do not redesign architecture.
- Do not introduce new dependencies unless explicitly asked.
- Preserve existing naming, schema, API contracts, and folder conventions.
- Prefer existing patterns over new abstractions.
- Treat spec/ai files as the source of truth unless code clearly contradicts them.
- If spec and code conflict, report the conflict before changing anything.

First respond with:
1. Product understanding
2. Current architecture understanding
3. Active tasks
4. Risks or missing context
5. Files you expect to touch

Wait for my instruction before editing code.