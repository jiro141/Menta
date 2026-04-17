# Skill Registry - Menta

This file tracks all AI agent skills available for this project.

## User-Level Skills (Global)

Located in `C:\Users\Felipe\.config\opencode\skills\`:

| Skill | Trigger | Description |
|-------|---------|-------------|
| sdd-init | "sdd init", "iniciar sdd" | Initialize SDD context in any project |
| sdd-explore | Exploration requests | Explore and investigate ideas before committing |
| sdd-propose | Proposal requests | Create change proposal with intent, scope, approach |
| sdd-spec | Spec requests | Write specifications with requirements and scenarios |
| sdd-design | Design requests | Create technical design with architecture decisions |
| sdd-tasks | Task breakdown requests | Break down change into implementation checklist |
| sdd-apply | Implementation requests | Implement tasks from change, write code |
| sdd-verify | Verification requests | Validate implementation matches specs and design |
| sdd-archive | Archive requests | Sync delta specs to main and archive completed change |
| go-testing | Go tests, Bubbletea TUI | Go testing patterns |
| skill-creator | "create new skill" | Create new AI agent skills |

## Project-Level Skills

None configured.

## Project Conventions

No agent convention files detected in project root.

## Notes

- Stack: React 19 + Vite + Zustand + Tailwind CSS (Frontend), Django 6 + DRF + SQLite (Backend)
- No testing framework configured yet
- No openspec directory - using engram mode for SDD persistence
