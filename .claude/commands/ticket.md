Create a well-structured ticket from the current plan or feature request in the conversation.

Follow these steps:

1. **Extract** the core intent from the conversation — what needs to be built, fixed, or changed.

2. **Write the ticket** using this exact format:

```
# [TYPE] Short imperative title (max 60 chars)

## Context
One paragraph explaining WHY this work is needed. Link to the relevant constraint, user story, or decision from the conversation.

## User story
As a [user type], I want [capability] so that [benefit].
(Skip if this is a chore or technical task with no direct user impact.)

## Acceptance criteria
- [ ] Criterion written as an observable, testable outcome
- [ ] Each criterion is binary — either done or not done
- [ ] Cover the happy path, edge cases, and any explicit non-goals

## Tasks
- [ ] Concrete implementation step
- [ ] Each task is small enough to complete in one sitting
- [ ] Ordered by dependency (blockers first)

## Technical notes
Key constraints, decisions, or references a developer needs before starting.
(Architecture choices, relevant files, external APIs, known risks.)

## Metadata
- **Type**: Feature | Bug | Chore | Spike
- **Priority**: High | Medium | Low
- **Effort**: S (< 2h) | M (half day) | L (1–2 days) | XL (> 2 days)
- **Blocked by**: ticket title or "none"
- **Blocks**: ticket title or "none"
```

3. **Save the ticket** as a markdown file in `docs/tickets/` using the filename format:
   `YYYY-MM-DD-short-slug.md`
   where the date is today and the slug is the title lowercased with spaces replaced by hyphens.

4. **Report back** with the filename and a one-sentence summary of the ticket.

Rules:
- Acceptance criteria must be verifiable — never write "works correctly" or "feels right"
- Tasks must be actionable — never write "research X" unless it's a Spike type
- Technical notes must reference actual files or decisions from this project, not generic advice
- If the plan is ambiguous, write the ticket for the most specific reasonable interpretation and flag what was assumed
