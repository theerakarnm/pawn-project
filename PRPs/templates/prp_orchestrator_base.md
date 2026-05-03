name: "Orchestrator PRP Template - Hierarchical Feature Coordinator"
description: |
  Template for the main/orchestrator PRP in a hierarchical PRP set.
  This file is the ONLY entry point the agent reads when executing.
  It coordinates shared knowledge and execution order across all parts.

## Core Principles
1. **Single Source of Truth**: All shared context lives HERE, not in part-PRPs
2. **Strict Ordering**: Parts execute sequentially — gate must pass before next part starts
3. **Explicit Contracts**: Every handoff (produces/consumes) is a named file path or export
4. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
{{FEATURE_GOAL}}
<!-- What needs to be built — be specific about the end state -->

## Why
- {{BUSINESS_VALUE}}
- {{USER_IMPACT}}
- {{PROBLEM_SOLVED}}

## What
{{HIGH_LEVEL_DESCRIPTION}}
<!-- What the system does when complete — user-visible behavior -->

### Success Criteria
- [ ] {{MEASURABLE_OUTCOME_1}}
- [ ] {{MEASURABLE_OUTCOME_2}}
- [ ] All part gates pass independently
- [ ] Full system validation passes

---

## Shared Knowledge
> The agent MUST keep this section in active context throughout all parts.
> Part-PRPs reference this section — they do not repeat it.

### Tech Stack
| Layer | Choice | Version |
|---|---|---|
| Runtime | {{RUNTIME}} | {{VERSION}} |
| Framework | {{FRAMEWORK}} | {{VERSION}} |
| Database | {{DATABASE}} | {{VERSION}} |
| ORM | {{ORM}} | {{VERSION}} |
| Test runner | {{TEST_RUNNER}} | {{VERSION}} |
| Linter | {{LINTER}} | {{VERSION}} |
| Deployment | {{DEPLOY_TARGET}} | — |

### Documentation & References
```yaml
# MUST READ before executing any part

- url: {{OFFICIAL_DOCS_URL}}
  why: {{SPECIFIC_SECTIONS_OR_METHODS_NEEDED}}

- file: {{path/to/existing/example}}
  why: {{PATTERN_TO_FOLLOW_OR_GOTCHA_TO_AVOID}}

- doc: {{LIBRARY_DOCS_URL}}
  section: {{SPECIFIC_SECTION}}
  critical: {{KEY_INSIGHT_THAT_PREVENTS_COMMON_ERRORS}}

- docfile: PRPs/ai_docs/{{file.md}}
  why: {{WHAT_THIS_DOC_CONTAINS}}
```

### Current Codebase Tree
```bash
# Run: tree -L 3 --gitignore in project root
{{CURRENT_TREE}}
```

### Desired Codebase Tree After All Parts Complete
```bash
# Files to be added are marked with [NEW]
# Files to be modified are marked with [MOD]
{{DESIRED_TREE}}
```

### Code Conventions
```yaml
# For each convention, cite the real file where the pattern lives
routing:
  pattern: {{CONVENTION}}
  reference: {{FILE_PATH}}

service_layer:
  pattern: {{CONVENTION}}
  reference: {{FILE_PATH}}

error_shape:
  pattern: {{CONVENTION}}
  reference: {{FILE_PATH}}

response_format:
  pattern: {{CONVENTION}}
  reference: {{FILE_PATH}}

validation:
  pattern: {{CONVENTION}}
  reference: {{FILE_PATH}}
```

### Shared Types
```yaml
# Types produced in part1 and consumed by all subsequent parts
# Paths must be exact — part-PRPs will import from here

- type: {{TypeName}}
  path: {{src/path/to/types.ts}}
  produced_by: Part 1
  consumed_by: [Part 2, Part 3]

- type: {{TypeName}}
  path: {{src/path/to/types.ts}}
  produced_by: Part 1
  consumed_by: [Part 3]
```

### Environment Variables
```yaml
# All env vars required across the entire feature
# Parts reference this list — they do not redefine vars

- name: {{VAR_NAME}}
  purpose: {{DESCRIPTION}}
  default: {{DEFAULT_OR_REQUIRED}}
  required_by: [Part 1, Part 2]

- name: {{VAR_NAME}}
  purpose: {{DESCRIPTION}}
  default: {{DEFAULT_OR_REQUIRED}}
  required_by: [Part 3]
```

### Known Gotchas (Global)
```
# CRITICAL: {{LIBRARY_OR_PATTERN}} requires {{SPECIFIC_SETUP}}
# CRITICAL: {{COMMON_MISTAKE}} — always {{CORRECT_APPROACH}} instead
# GOTCHA: {{VERSION_SPECIFIC_ISSUE}} in {{LIBRARY}} v{{VERSION}}
```

---

## Dependency Graph
```
# Build this BEFORE writing any part-PRP
# Each arrow = "must be ✅ complete before"

{{PART_1_CONCERN}}   → no dependencies (foundation)
{{PART_2_CONCERN}}   → depends on Part 1 ✅
{{PART_3_CONCERN}}   → depends on Part 2 ✅
{{PART_N_CONCERN}}   → depends on Part N-1 ✅
```

---

## Execution Plan

Execute parts **strictly in order**.
**Do not start a part until the previous part's validation gate passes.**

---

### PART 1 — {{CONCERN_NAME}}
**File:** `PRPs/{{feature-name}}/part1-prp-{{concern}}.md`
**Purpose:** {{ONE_SENTENCE}}
**Depends on:** None — foundation

**Produces:**
```yaml
- artifact: {{FILENAME_OR_EXPORT}}
  path: {{EXACT_PATH}}
  description: {{WHAT_IT_IS}}

- artifact: {{FILENAME_OR_EXPORT}}
  path: {{EXACT_PATH}}
  description: {{WHAT_IT_IS}}
```

**Validation gate:**
```bash
{{EXECUTABLE_COMMAND_NO_PLACEHOLDERS}}
```
**Checkpoint:** ✅ {{WHAT_PASSING_LOOKS_LIKE}}

---

### PART 2 — {{CONCERN_NAME}}
**File:** `PRPs/{{feature-name}}/part2-prp-{{concern}}.md`
**Purpose:** {{ONE_SENTENCE}}
**Depends on:** PART 1 ✅

**Consumes from Part 1:**
```yaml
- artifact: {{FILENAME_OR_EXPORT}}
  path: {{EXACT_PATH}}
  used_for: {{WHY_THIS_PART_NEEDS_IT}}
```

**Produces:**
```yaml
- artifact: {{FILENAME_OR_EXPORT}}
  path: {{EXACT_PATH}}
  description: {{WHAT_IT_IS}}
```

**Validation gate:**
```bash
{{EXECUTABLE_COMMAND_NO_PLACEHOLDERS}}
```
**Checkpoint:** ✅ {{WHAT_PASSING_LOOKS_LIKE}}

---

### PART N — {{CONCERN_NAME}}
<!-- Repeat PART block for each additional part -->

---

## Full System Validation
> Run ONLY after all parts have passed their individual gates.

### Level 1: All Part Gates
```bash
# Re-run every part gate to confirm nothing regressed
{{PART_1_GATE_COMMAND}}
{{PART_2_GATE_COMMAND}}
{{PART_N_GATE_COMMAND}}
```

### Level 2: Integration
```bash
# Start the full service
{{START_COMMAND}}

# Smoke test the happy path
{{INTEGRATION_TEST_COMMAND}}

# Expected: {{EXPECTED_OUTPUT}}
# If error: {{WHERE_TO_LOOK_FOR_LOGS}}
```

### Final Checklist
- [ ] All part gates pass
- [ ] Integration smoke test passes
- [ ] No regressions in existing tests: `{{EXISTING_TEST_COMMAND}}`
- [ ] No linting errors: `{{LINT_COMMAND}}`
- [ ] No type errors: `{{TYPE_CHECK_COMMAND}}`
- [ ] Error cases handled gracefully
- [ ] Env vars documented in `.env.example`

---

## Rollback Strategy

| Scenario | Action |
|---|---|
| Part N gate fails | Fix part N only. Re-run part N gate. Do NOT re-run earlier parts. |
| Schema changed after Part 1 | Re-run Part 1 gate first, then re-validate downstream parts. |
| External API unavailable | Switch to mock mode — see mock instructions in relevant part-prp. |
| Shared type changes | Re-read Shared Knowledge, update all parts that consume that type. |

---

## Known Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| {{RISK}} | High / Med / Low | {{MITIGATION}} |
| {{RISK}} | High / Med / Low | {{MITIGATION}} |

---

## Execution Rules for Agent

**Must:**
1. Read this file fully before opening any part-prp
2. Keep **Shared Knowledge** in active context throughout all parts
3. Open each part-prp → implement → run its gate → confirm checkpoint
4. Report each checkpoint result before moving to the next part
5. On gate failure: stop, diagnose, fix, re-run gate — do not skip forward

**Must not:**
- Reorder parts
- Skip validation gates
- Modify a completed part's output without explicit instruction
- Assume a gate passes without running it
- Re-implement shared types/conventions already defined above

## Anti-Patterns to Avoid
- ❌ Don't scatter shared context into individual part-PRPs
- ❌ Don't proceed to the next part when the current gate fails
- ❌ Don't create new conventions when existing ones are documented above
- ❌ Don't hardcode values that are defined as env vars
- ❌ Don't catch all exceptions — be specific
- ❌ Don't ignore a failing gate — fix root cause, never mock to pass