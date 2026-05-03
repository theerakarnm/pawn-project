# Create PRP Command (Comprehensive)

## Usage
```
Create PRP from raw-plan/<feature-file.md>
```

---

## PHASE 1 — Read & Understand

Read the feature file at the path provided.  
Extract and note:
- **Feature goal** — what does this feature do?
- **Scope signals** — how many distinct domains are touched? (DB, API, Auth, External, Frontend, Infra…)
- **Complexity signals** — new patterns? external integrations? multi-role? migrations?
- **Constraints** — deadlines, existing code to preserve, specific libraries required

---

## PHASE 2 — Codebase Analysis

Search the existing codebase for:

1. **Similar features** — find the closest existing feature and note its file structure
2. **Patterns to mirror** — routing conventions, service layer patterns, error handling, response shapes
3. **Test patterns** — how are tests structured? what's the test naming convention?
4. **Config/env patterns** — how are env vars declared and validated?
5. **Database conventions** — migration style, schema naming, relation patterns

**Document findings as:**
```
CODEBASE PATTERN: <what you found> → <file path where it lives>
```

---

## PHASE 3 — External Research

For each library or integration in scope, find and record:

- Official docs URL with specific section (not just homepage)
- Any known version-specific gotchas relevant to the current stack
- A real implementation example (GitHub/docs snippet)

**Research must be concrete** — no generic descriptions. Every finding becomes context passed to the AI agent.

---

## PHASE 4 — ULTRATHINK

**Stop. Do not write yet.**

Think through the complete implementation:
- What are the natural domain boundaries?
- What must be built before something else can exist?
- What is the riskiest part of this feature?
- Where could an AI agent get confused or produce incorrect output?
- How would you validate correctness at each stage?

Estimate a **complexity score** based on:

| Signal | Weight |
|---|---|
| Touches 3+ distinct domains (DB, API, Auth, External, UI) | +2 |
| Requires 2+ external API integrations | +2 |
| Multi-role / permission logic | +1 |
| Schema migration on existing data | +1 |
| Requires new infra (new service, queue, worker) | +1 |
| No existing pattern to mirror | +1 |
| Single-domain, clear pattern exists | -2 |

---

## PHASE 5 — Score & Route

### Score the PRP confidence (1–10)
> Confidence that an AI agent can implement this correctly in **one pass** without human intervention

**If score ≥ 7 → proceed to [SINGLE PRP](#single-prp)**  
**If score < 7 → proceed to [HIERARCHICAL PRP](#hierarchical-prp)**

---

## SINGLE PRP

1. Read template: `PRPs/templates/prp_base.md`
2. Fill every `{{PLACEHOLDER}}` with research findings from phases 1–3
3. Save to: `PRPs/{feature-name}.md`

The template defines all required sections — follow its structure exactly.  
Do not skip sections; write `N/A — not applicable` if a section genuinely does not apply.

---

## HIERARCHICAL PRP

### Step 1 — Identify Split Boundaries

Natural boundaries to split on (in priority order):
1. **Data layer** — schema, migrations, seed data
2. **Core business logic** — services, domain rules, calculations
3. **API / transport layer** — routes, handlers, middleware
4. **External integrations** — 3rd party APIs, webhooks, queues
5. **Frontend / UI** — components, pages, forms
6. **Infra / deployment** — Docker, env, CI, cron

Each boundary that represents a significant scope = 1 part.  
Target: 2–5 parts. If you need more than 5, revisit the boundaries.

### Step 2 — Map Dependencies

Build a dependency graph before writing anything:
```
part1 (DB layer) → no dependencies
part2 (Services) → depends on part1 ✅
part3 (API)      → depends on part2 ✅
part4 (External) → depends on part3 ✅
```

Each part must know:
- **Input** — what artifacts from previous parts does it consume?
- **Output** — what artifacts does it produce for the next part?
- **Handoff contract** — specific file paths, exported types, env vars, DB tables

### Step 3 — Create Directory Structure

```
PRPs/
└── {feature-name}/
    ├── main-prp-{feature-name}.md    ← YOU ARE WRITING THIS FIRST
    ├── part1-prp-{concern}.md
    ├── part2-prp-{concern}.md
    └── partN-prp-{concern}.md
```

### Step 4 — Write main-prp-{feature-name}.md

1. **Read template:** `PRPs/templates/prp_orchestrator_base.md`
2. Replace every `{{PLACEHOLDER}}` with the actual values from your research
3. Fill the **Execution Plan** section with one `PART` block per identified boundary  
   (copy the PART block pattern from the template and repeat for each part)
4. Save to: `PRPs/{feature-name}/main-prp-{feature-name}.md`

> The orchestrator is the **only** file the agent opens when executing.  
> It must be completely self-contained — all shared knowledge lives here, not scattered in part-prps.

---

### Step 5 — Write Each part-prp-{concern}.md

For **each** part identified in Step 1:

1. **Read template:** `PRPs/templates/prp_part_base.md`
2. Replace every `{{PLACEHOLDER}}` with part-specific values
3. In the **Consumes** table — reference exact paths produced by the previous part  
   (copy these from the previous part's **Produces** table — they must match exactly)
4. Write a **validation gate** that is a real executable bash command with no placeholders
5. Save to: `PRPs/{feature-name}/partN-prp-{concern}.md`

> Each part-prp must be self-contained for its concern.  
> It must NOT re-define shared knowledge — only reference main-prp for those.

---

### Step 6 — Re-score Each Part

Every part-prp must individually score **≥ 8**.  
If any part scores < 8, split it further or add more context.

---

## EXECUTION COMMAND

When the user says **"execute main-prp-{feature-name}"**, the agent should:

1. Read `PRPs/{feature-name}/main-prp-{feature-name}.md` fully
2. Load shared knowledge into working context
3. Open `part1-prp-*.md` → implement → run validation gate
4. If gate ✅ → open `part2-prp-*.md` → implement → run gate
5. Continue until all parts complete
6. Run full system validation
7. Report: parts completed, gates passed, any deviations from plan

**The agent must NOT:**
- Skip parts or reorder them
- Start the next part before the current gate passes
- Modify previous parts' output unless explicitly instructed

---

## Quality Checklist

### Single PRP
- [ ] All necessary context included
- [ ] Codebase patterns referenced (with file paths)
- [ ] External docs URLs included (specific sections, not homepages)
- [ ] Validation gates are executable bash commands
- [ ] Ordered task list is clear
- [ ] Error handling documented
- [ ] Gotchas listed
- [ ] Score ≥ 7

### Hierarchical PRP
- [ ] main-prp contains complete shared knowledge
- [ ] Dependency graph is explicit (no circular dependencies)
- [ ] Each part has a clear handoff contract (produces/consumes)
- [ ] Each part has an independently executable validation gate
- [ ] Validation gates are idempotent (safe to re-run)
- [ ] Rollback strategy documented
- [ ] Every part scores ≥ 8 individually
- [ ] Directory structure matches `PRPs/{feature-name}/` convention

---

## Output Summary

After generating all files, print:

```
PRP Generation Complete
═══════════════════════════════════

Feature  : {feature name}
Type     : Single | Hierarchical
Score    : {n}/10

Files created:
  PRPs/{...}.md          ← {description}
  PRPs/{...}/main-prp-*.md   ← Orchestrator
  PRPs/{...}/part1-prp-*.md  ← {concern}
  PRPs/{...}/part2-prp-*.md  ← {concern}

To execute:
  "execute main-prp-{feature-name}"

Risks flagged:
  - {risk if any}
```