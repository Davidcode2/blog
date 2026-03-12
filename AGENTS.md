# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Version-controlled: Built on Dolt with cell-level merge
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

---

## Project Structure

This is **The Learning Corner** - an 11ty (Eleventy) static site blog with the following structure:

```
blog/
├── _includes/              # Nunjucks templates
│   ├── layout.njk         # Base layout (header, theme toggle, analytics)
│   └── post-layout.njk    # Post-specific layout wrapper
├── _11ty/                 # Custom 11ty plugins
│   └── plantuml.js        # PlantUML diagram generation plugin
├── posts/                 # Blog posts (Markdown files)
│   ├── *.md               # Individual posts
│   └── */                 # Posts with assets (images, diagrams)
├── assets/                # Static assets (favicons, images)
├── css/                   # Generated Tailwind CSS output
├── admin/                 # Decap CMS configuration
├── _site/                 # Build output (generated, not committed)
├── eleventy.config.js     # 11ty configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── input.css              # Tailwind source styles
├── package.json           # Node dependencies
├── dockerfile             # Multi-stage Docker build
└── nginx.conf             # Nginx server configuration
```

### Technology Stack

- **Static Site Generator**: 11ty (Eleventy) v3.0
- **Templating**: Nunjucks (.njk)
- **Styling**: Tailwind CSS v4.0
- **Content**: Markdown with YAML frontmatter
- **Diagrams**: PlantUML (via custom plugin)
- **CMS**: Decap CMS (Git-based)
- **Build**: Docker multi-stage build
- **Deployment**: GitHub Actions → GHCR → Hetzner Cloud server

---

## Working with the Repository

### Prerequisites

- Node.js 22+
- npm
- Java 17+ (for PlantUML diagrams)
- Graphviz (for PlantUML)

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (11ty + Tailwind watch)
npm start

# Build for production
npm run build

# Build only 11ty
npm run build:11ty

# Build only CSS
npm run build:css
```

### Creating a New Post

Posts are Markdown files in the `posts/` directory with YAML frontmatter:

```markdown
---
title: Your Post Title
date: 2025-03-12
tags: post
layout: post-layout.njk
---

Your content here...

For PlantUML diagrams:
@startuml
Client -> Server : request
Server --> Client : response
@enduml
```

**Frontmatter fields:**
- `title` (required): Post title
- `date` (required): Publication date (YYYY-MM-DD)
- `tags: post` (required): Marks as blog post
- `layout: post-layout.njk` (required): Uses post template

### Adding Images

For posts with images, create a subdirectory:
```
posts/
└── my-post/
    ├── my-post.md
    └── image.png
```

Images in post subdirectories are automatically copied to `_site`.

### PlantUML Diagrams

Include PlantUML diagrams directly in Markdown:
- Use `@startuml` / `@enduml` blocks
- Diagrams are rendered during build (production only)
- Both inline and fenced code blocks supported
- Generated PNGs include tabbed UI (image/code view)

**Requirements:**
- Java must be installed
- PlantUML JAR at `~/.plantuml/plantuml.jar`

### Build Process

1. **Local Development**: `npm start` runs both 11ty server and Tailwind watcher
2. **Production Build**: Docker multi-stage build
   - Stage 1: Node.js + Java/Graphviz/PlantUML → builds static site
   - Stage 2: Nginx Alpine → serves static files

### Deployment Flow

```
Push to main → GitHub Actions → Build Docker image → Push to GHCR → Deploy to Hetzner
```

The workflow triggers on:
- Changes to `posts/**`
- Manual workflow dispatch

### Useful Patterns

**Date formatting in templates:**
```nunjucks
{{ date | formatDate("MMMM d, yyyy") }}
```

**Accessing post collections:**
```nunjucks
{%- for post in collections.post %}
  {{ post.data.title }}
  {{ post.url }}
{%- endfor %}
```

**TLDR shortcode:**
```markdown
{% tldr %}
Your summary here
{% endtldr %}
```

---

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
