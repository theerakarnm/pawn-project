# Execute PRP

Implement a feature using a PRP file — supports both single PRPs and hierarchical (orchestrator + parts) PRPs.

## PRP File: $ARGUMENTS

---

## Step 1 — Load & Classify

Read the specified PRP file completely.

Determine which type it is:

```
IF the file contains an "Execution Plan" section with PART blocks
  → TYPE: Orchestrator (hierarchical)
  → GOTO: Orchestrator Execution Path

ELSE
  → TYPE: Single PRP
  → GOTO: Single PRP Execution Path
```

---

## Single PRP Execution Path

### 1. Understand
- Read the full PRP — understand all context, requirements, and constraints
- Extend research if needed: additional web searches, codebase exploration
- Ensure you have everything needed to implement without ambiguity

### 2. ULTRATHINK
- Think hard before writing any code
- Create a comprehensive plan addressing all requirements
- Break down into smaller steps using TodoWrite
- Identify implementation patterns from existing code to follow

### 3. Execute
- Implement all tasks in the order listed in the PRP
- Follow existing conventions — do not invent new patterns

### 4. Validate (run all levels, in order)
```
Level 1 → Syntax & Style
  Run lint + type check commands from PRP
  Fix ALL errors before proceeding
  Re-run until clean

Level 2 → Unit Tests
  Run test command from PRP
  If failing: read error, fix root cause, re-run
  NEVER mock internals just to make tests pass

Level 3 → Integration
  Start service, run integration command from PRP
  Verify expected response shape
  If error: check logs, fix, re-run
```

### 5. Complete
- Re-read the PRP from top to bottom
- Verify every checklist item is done
- Run the full final validation suite
- Report:
  ```
  ✅ Single PRP Complete: {{PRP_NAME}}
  Validation: L1 ✅ | L2 ✅ | L3 ✅
  Checklist: {{N}}/{{N}} items done
  ```

---

## Orchestrator Execution Path

### 1. Load Shared Knowledge
- Read the **entire** orchestrator file
- Extract and hold in active context:
  - Tech stack
  - Code conventions (with file paths)
  - Shared types and their paths
  - Environment variables
  - Known gotchas
  - Dependency graph
- **Do not start any part until this is fully loaded**

### 2. ULTRATHINK
- Review the full dependency graph
- Understand what each part produces and what the next part consumes
- Identify the riskiest part and plan extra care there
- Use TodoWrite to create a checklist: one item per part + one for full system validation

### 3. Execute Parts — Strictly in Order

For **each part**, follow this loop:

```
─────────────────────────────────────────────
PART LOOP (repeat for Part 1 → Part N)
─────────────────────────────────────────────

a) OPEN the part-prp file
   Read it fully — understand scope, consumes, produces, tasks

b) VERIFY preconditions
   Confirm all artifacts in "Consumes" exist at declared paths
   If missing → stop, report which previous part's output is absent

c) ULTRATHINK (per part)
   Review the task list
   Map tasks to existing code patterns from Shared Knowledge
   Plan implementation before writing any code

d) IMPLEMENT
   Execute tasks in the order listed in the part-prp
   Follow Shared Knowledge conventions — do not re-invent
   Do not implement anything listed as out-of-scope

e) VALIDATE — Level 1: Syntax & Style
   Run lint + type check from part-prp
   Fix ALL errors
   Re-run until clean — do not proceed with lint errors

f) VALIDATE — Level 2: Unit Tests
   Run unit tests from part-prp
   If failing: read error → fix root cause → re-run
   All tests must pass — never mock to pass

g) VALIDATE — Level 3: Integration (if applicable)
   Run integration check from part-prp
   Verify expected output

h) RUN GATE COMMAND
   Run the part's gate summary command
   
   IF gate FAILS:
     → Stop immediately — do not open the next part-prp
     → Diagnose: read full error output
     → Fix root cause in the current part's files only
     → Re-run gate
     → Repeat until gate passes
     → Do NOT modify previous parts' outputs to fix this part

   IF gate PASSES:
     → Mark part complete in TodoWrite
     → Report checkpoint (see format below)
     → Proceed to next part

─────────────────────────────────────────────
```

**Checkpoint report format (print after each part's gate passes):**
```
──────────────────────────────────────
✅ CHECKPOINT: Part {{N}} — {{CONCERN_NAME}}
   Gate: PASSED
   Produces verified:
     ✓ {{artifact}} at {{path}}
     ✓ {{artifact}} at {{path}}
   Next: Part {{N+1}} — {{NEXT_CONCERN_NAME}}
──────────────────────────────────────
```

### 4. Full System Validation

Run ONLY after all parts have passed their individual gates.

```
Level 1 → Re-run all part gates
  Confirm nothing regressed
  All must pass before continuing

Level 2 → Integration
  Start full service
  Run integration / smoke test from orchestrator
  Verify expected response

Level 3 → Regression
  Run existing test suite
  No previously passing tests should now fail
```

### 5. Complete

Re-read the orchestrator file from top to bottom.
Verify every item in the orchestrator's Final Checklist is done.

Report:
```
══════════════════════════════════════════
✅ Orchestrator Complete: {{FEATURE_NAME}}
══════════════════════════════════════════
Parts executed:
  ✅ Part 1 — {{CONCERN}} | Gate: PASSED
  ✅ Part 2 — {{CONCERN}} | Gate: PASSED
  ✅ Part N — {{CONCERN}} | Gate: PASSED

Full system validation:
  L1 (all gates): ✅
  L2 (integration): ✅
  L3 (regression): ✅

Checklist: {{N}}/{{N}} items done
Deviations from plan: {{NONE or description}}
══════════════════════════════════════════
```

---

## Failure Handling (both paths)

| Situation | Action |
|---|---|
| Validation fails | Read full error → fix root cause → re-run (never skip or mock) |
| Part gate fails | Fix current part only → re-run gate → do not touch previous parts |
| Missing artifact from previous part | Stop → report which part's output is absent → do not continue |
| External service unavailable | Enable mock mode per part-prp instructions → continue → note in final report |
| Ambiguous requirement | Re-read PRP → if still unclear, implement the more conservative interpretation and flag it in the completion report |

---

## Rules (apply to both paths)

- Always re-read the PRP if you lose context during a long implementation
- Never skip a validation level because "it should work"
- Never modify previous parts' outputs to fix a later part — fix the later part
- Never invent new patterns when existing ones are documented in the PRP
- Never proceed past a failed gate