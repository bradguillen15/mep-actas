# LIDR SDD Harness

Reusable AI development harness extracted from [AI4Devs-LTI-extended](https://github.com/LIDR-academy/AI4Devs-LTI-extended).

**This repo is the harness only** — not an application. Copy it into a new or existing project, then add your app code and project-specific documentation.

## Quick start

```bash
# Option A — new project: copy the whole harness as your starting point
cp -R harness-lidr-sdd/ my-new-project/
cd my-new-project

# Option B — existing project: copy harness folders into it
cp -R harness-lidr-sdd/{ai-specs,openspec,.cursor,.claude,.codegraph,AGENTS.md,CLAUDE.md} my-existing-project/
cp -R harness-lidr-sdd/docs/* my-existing-project/docs/
```

Then follow **[docs/initialize-project.md](docs/initialize-project.md)** to finish setup.

## What's in this repo

| Included (harness) | Not included (per project) |
|--------------------|----------------------------|
| `ai-specs/` agents & skills | `backend/`, `frontend/` application code |
| `openspec/config.yaml` + `schemas/` | `openspec/specs/` domain capability specs |
| `.cursor/`, `.claude/` agent surfaces | `openspec/changes/` feature history |
| `docs/base-standards.md` and workflow docs | `docs/api-spec.yml`, `docs/data-model.md` |
| `AGENTS.md`, `CLAUDE.md` | `docs/development_guide.md` |

## Prerequisites

- [OpenSpec CLI](https://github.com/Fission-AI/OpenSpec): `npm install -g @fission-ai/openspec`
- Cursor and/or Claude Code

## Workflow

```
enrich-us → opsx:new → opsx:ff → opsx:apply → opsx:verify → opsx:archive
```

Run `/opsx:onboard` in Cursor for a guided first cycle.
