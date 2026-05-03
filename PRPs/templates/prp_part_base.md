name: "Part PRP Template - Single Concern Implementation Unit"
description: |
  Template for each individual part in a hierarchical PRP set.
  One part = one domain concern. Self-contained for its scope.
  Shared context lives in the orchestrator — not here.

## Core Principles
1. **Focused Scope**: This part does ONE thing well — no cross-concern drift
2. **Explicit Handoff**: Consumes and produces are exact paths, not descriptions
3. **Validation Loops**: 3-level gates — syntax → unit → integration
4. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

# Part {{N}} PRP: {{CONCERN_NAME}}
> **Part of:** `PRPs/{{feature-name}}/main-prp-{{feature-name}}.md`
> **Shared context (stack, conventions, types, env vars):** read from orchestrator before starting

---

## Scope

**This part does:**
- {{IN_SCOPE_1}}
- {{IN_SCOPE_2}}
- {{IN_SCOPE_3}}

**This part does NOT:**
- {{OUT_OF_SCOPE_1}} ← handled in Part {{N}}
- {{OUT_OF_SCOPE_2}} ← handled in Part {{N}}

---

## Depends On
```yaml
# State which part must be ✅ complete before this part can run
# For Part 1 (foundation): write "none"

- part: {{N-1}}
  concern: {{CONCERN_NAME}}
  needs:
    - artifact: {{SPECIFIC_FILE_OR_EXPORT}}
      path: {{EXACT_PATH}}
```

## Consumes
```yaml
# Exact artifacts this part reads from previous parts
# Paths must match exactly what the previous part's "Produces" declared

- artifact: {{TypeName / TableName / FunctionName}}
  path: {{EXACT_FILE_PATH}}
  provided_by: Part {{N}}
  used_for: {{WHY_THIS_PART_NEEDS_IT}}
```

## Produces
```yaml
# Exact artifacts this part creates — will be consumed by next part
# Paths here must match exactly what the next part's "Consumes" expects

- artifact: {{TypeName / TableName / FunctionName}}
  path: {{EXACT_FILE_PATH}}
  consumed_by: Part {{N+1}}
  description: {{WHAT_IT_IS}}
```

---

## Part-Specific Research
```yaml
# Docs and examples relevant ONLY to this part's concern
# For shared/global docs see orchestrator → Documentation & References

- url: {{DOCS_URL#specific-anchor}}
  why: {{SPECIFIC_GOTCHA_OR_METHOD_NEEDED}}
  critical: {{KEY_INSIGHT}}

- file: {{path/to/existing/similar/file}}
  why: {{EXACT_PATTERN_TO_MIRROR}}
```

### Part-Specific Gotchas
```
# CRITICAL: {{LIBRARY_OR_PATTERN}} — {{WHAT_WILL_GO_WRONG_IF_IGNORED}}
# GOTCHA: {{VERSION_SPECIFIC_ISSUE}}
# NOTE: {{NON_OBVIOUS_BEHAVIOR}}
```

---

## Data Models
```
# Define the core data structures this part introduces
# Examples: DB schema, ORM models, Zod schemas, TypeScript interfaces, Pydantic models

{{DATA_MODEL_CODE_OR_PSEUDOCODE}}
```

---

## Implementation Blueprint

### Task List
```yaml
# Each task = one focused edit. Use MODIFY/CREATE/FIND/INJECT keywords.
# Order matters — list in the sequence the agent should execute.

Task 1:
  CREATE {{src/path/to/new-file.ts}}:
    - MIRROR pattern from: {{src/path/to/existing-file.ts}}
    - MODIFY: {{what to change from the pattern}}
    - KEEP: {{what to preserve exactly}}

Task 2:
  MODIFY {{src/path/to/existing-file.ts}}:
    - FIND pattern: "{{exact string or function signature to locate}}"
    - INJECT after: "{{anchor line}}"
    - PRESERVE: existing method signatures

Task 3:
  CREATE {{src/path/to/another-file.ts}}:
    - IMPLEMENT: {{what this file does}}
    - FOLLOW error handling from: {{reference file path}}

Task N:
  # Run validation gate (Level 1 first, then 2, then 3)
```

### Pseudocode
```
// Write the approach BEFORE referencing real files
// Focus on the logic flow — not the exact syntax
// Mark CRITICAL decisions and GOTCHA points inline

// Example:
// 1. validate input against {{schema}} (raises on invalid)
// 2. CRITICAL: acquire rate limit token before external call
// 3. call {{external_service}} with retry(attempts=3, backoff=exponential)
// 4. GOTCHA: response shape differs between v1 and v2 — check version header
// 5. transform to internal type {{TypeName}} (see shared types in orchestrator)
// 6. persist via {{repository_function}} (see src/db/...)
// 7. return standardized response shape (see conventions in orchestrator)
```

### Integration Points
```yaml
DATABASE:
  migration: "{{SQL or ORM migration description}}"
  index: "{{INDEX statement if needed}}"
  seed: "{{seed data for local dev if needed}}"

CONFIG:
  add_to: {{config/settings file path}}
  pattern: '{{VAR_NAME}} = {{type}}(os.getenv("{{VAR_NAME}}", "{{default}}"))'

ROUTES:
  add_to: {{src/routes or similar path}}
  pattern: "{{router.include or app.use pattern}}"

EXPORTS:
  add_to: {{src/index or barrel file}}
  exports: [{{TypeName}}, {{FunctionName}}]
```

---

## Validation Gate

### Level 1: Syntax & Style
```bash
# Run FIRST — fix all errors before proceeding to Level 2
{{LINT_COMMAND}} {{FILE_OR_DIR}}
{{TYPE_CHECK_COMMAND}} {{FILE_OR_DIR}}

# Expected: no errors
# If errors: READ the error message, fix root cause, re-run (do not suppress)
```

### Level 2: Unit Tests
```
# Write tests covering these cases before running:

Test: happy path
  input: {{VALID_INPUT_EXAMPLE}}
  expected: {{EXPECTED_OUTPUT}}

Test: validation error
  input: {{INVALID_INPUT_EXAMPLE}}
  expected: raises {{ERROR_TYPE}}

Test: edge case — {{EDGE_CASE_DESCRIPTION}}
  input: {{EDGE_INPUT}}
  expected: {{EDGE_OUTPUT}}

Test: external dependency failure (mock)
  mock: {{WHAT_TO_MOCK}} → {{SIMULATED_FAILURE}}
  expected: {{GRACEFUL_HANDLING}}
```

```bash
# Run and iterate until all pass
{{TEST_COMMAND}} {{TEST_FILE_PATH}} -v

# If failing: read error, understand root cause, fix code, re-run
# NEVER mock internals just to make a test pass
```

### Level 3: Integration
```bash
# Start the service
{{START_COMMAND}}

# Test the happy path end-to-end
{{INTEGRATION_TEST_COMMAND}}

# Expected response:
# {{EXPECTED_RESPONSE_SHAPE}}

# If error: check {{LOG_LOCATION}} for stack trace
```

### Gate Summary
```bash
# This must fully pass before the orchestrator moves to the next part
{{GATE_SUMMARY_COMMAND}}
# Expected: {{EXIT_CODE_OR_OUTPUT}}
```

---

## Error Handling

| Error scenario | How to handle |
|---|---|
| {{ERROR_SCENARIO_1}} | {{HANDLING — specific, not generic}} |
| {{ERROR_SCENARIO_2}} | {{HANDLING — specific, not generic}} |
| External service timeout | Return `{ok: false, error: {code: "TIMEOUT"}}` — do not throw |
| Validation failure | Raise/throw typed error — let global handler map to HTTP status |

---

## Mock / Fallback Mode
```yaml
# For parts with external dependencies — define how to run without them
# If no external deps: write "not applicable"

env_var: {{ENV_VAR_NAME}}=mock
mock_file: {{path/to/mock/implementation}}
behavior: {{WHAT_THE_MOCK_RETURNS_OR_DOES}}
```

---

## Final Checklist for This Part
- [ ] All Level 1 checks pass (no lint / type errors)
- [ ] All Level 2 unit tests pass
- [ ] Level 3 integration test passes
- [ ] Produces artifacts exist at declared paths
- [ ] Consumes paths match previous part's produces exactly
- [ ] Error cases return correct shape (not raw exceptions)
- [ ] No hardcoded values that should be env vars
- [ ] No new conventions invented — existing patterns followed

---

## Part Score
> Confidence this part can be implemented correctly in one pass: **{{SCORE}}/10**
> *(Must be ≥ 8 before including in the hierarchical PRP set)*

**Score rationale:** {{WHY — what makes it confident or what gaps remain}}

---

## Anti-Patterns to Avoid
- ❌ Don't re-define shared types or conventions — import from paths declared in orchestrator
- ❌ Don't skip a validation level because "it should work"
- ❌ Don't mock internal logic to make tests pass — fix the implementation
- ❌ Don't create new error shapes — use the project-wide shape from orchestrator
- ❌ Don't implement anything listed as out-of-scope — it belongs in another part
- ❌ Don't produce artifacts at paths different from what you declared above