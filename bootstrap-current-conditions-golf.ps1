# --- Config ---
$Owner      = "rlhstylist"
$RepoName   = "current-conditions-golf"
$Private    = $false  # public per your choice
$Visibility = if ($Private) { "--private" } else { "--public" }
$Milestone  = "v0.1 MVP"
$DueDate    = (Get-Date).ToString("yyyy-MM-dd")  # today

# --- Create repo (idempotent-ish) ---
gh repo create "$Owner/$RepoName" $Visibility --confirm

# Seed minimal README so Codex has a remote to push to
$tempDir = Join-Path $env:TEMP "current-conditions-golf"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null
Set-Content -Path (Join-Path $tempDir "README.md") -Value @"
# Current Conditions Golf

Terminal-style, iPhone-first viewer for on-course weather: wind (phone-relative, approximate), temp/feels, humidity, UV+cloud, precip (24h/1h/3h). Auto-refresh, minimal UI.
"@

Set-Location $tempDir
git init
git add .
git commit -m "chore: bootstrap README"
git branch -M main
git remote add origin "https://github.com/$Owner/$RepoName.git"
git push -u origin main

# --- Labels ---
$labels = @(
  @{name="feat"; color="1f883d"; desc="New feature"},
  @{name="bug"; color="d73a4a"; desc="Something isn't working"},
  @{name="design"; color="a2eeef"; desc="Design / UI / UX"},
  @{name="infra"; color="a295d6"; desc="Tooling / CI / Deploy"},
  @{name="test"; color="bfd4f2"; desc="Testing"},
  @{name="accessibility"; color="0e8a16"; desc="A11y improvements"},
  @{name="performance"; color="5319e7"; desc="Perf budget"}
)
foreach ($l in $labels) {
  gh label create $l.name --color $l.color --description $l.desc 2>$null
}

# --- Milestone ---
gh milestone create "$Milestone" --due-date "$DueDate" 2>$null

function New-Issue {
param([string]$title,[string]$body,[string[]]$labels)
  $labelArgs = @()
  foreach ($lab in $labels) { $labelArgs += @("--label", $lab) }
  gh issue create --title $title --body $body --milestone "$Milestone" $labelArgs
}

# --- Issue bodies (Codex-ready). ---
$issues = @(
  @{
    t="Repo init: Vite+TS, MIT, README, ESLint/Prettier";
    l=@("infra","feat");
    b=@"
**Goal:** Scaffold Vite + TypeScript project with strict config, ESLint, Prettier, MIT license, basic README.

**Acceptance Criteria**
- `npm run dev` and `npm run build` succeed
- Lint/format scripts work
- MIT LICENSE present

**Tasks for Codex**
1) Initialize Vite + TS
2) ESLint + Prettier (strict)
3) NPM scripts
4) Commit to `main`

**Definition of Done**
- Baseline structure pushed

@codex please begin work on this task
"@
  },
  @{
    t="Netlify: auto-deploy from main (+ netlify.toml, account linking docs)";
    l=@("infra");
    b=@"
**Goal:** Configure Netlify deploys from `main`. Document how to connect a **specific Netlify account** to GitHub for this repo (owner may switch accounts to avoid usage limits).

**Acceptance Criteria**
- `netlify.toml` present
- Pushing to `main` triggers deploy
- README includes step-by-step linking instructions (Netlify UI) and environment notes

**Tasks for Codex**
1) Add `netlify.toml` for Vite static build
2) Write clear README steps for linking a chosen Netlify account to GitHub repo
3) First deploy succeeds

**Definition of Done**
- Public URL available

@codex please begin work on this task
"@
  },
  @{
    t="PWA: manifest + service worker (offline shell)";
    l=@("feat");
    b=@"
**Goal:** App is installable and loads offline shell.

**Acceptance Criteria**
- Valid web manifest
- Service worker caches app shell
- Lighthouse PWA installable

**Tasks for Codex**
1) Add manifest + icons
2) Minimal SW cache
3) Link in HTML

**Definition of Done**
- A2HS works on iOS

@codex please begin work on this task
"@
  },
  @{
    t="Terminal UI shell & layout grid (iPhone 14, no scroll)";
    l=@("design","feat");
    b=@"
**Goal:** Build base terminal theme and layout that fits on iPhone 14 without scrolling.

**Acceptance Criteria**
- Monospace, dark theme, subtle borders
- Top bar + primary wind tile + row of tiles + precip chips
- Large numeric values; compact labels

**Tasks for Codex**
1) Style tokens + CSS grid
2) Placeholder components

**Definition of Done**
- Verified at 390×844 viewport

@codex please begin work on this task
"@
  },
  @{
    t="Geolocation flow + deny-case modal (manual course search)";
    l=@("feat");
    b=@"
**Goal:** Request GPS on load; if denied, show modal with course search field and 'Use this course'.

**Acceptance Criteria**
- Permission request on first visit
- Modal appears on deny; selection persists

**Tasks for Codex**
1) Geolocation wrapper with timeouts
2) Modal UI + store choice

**Definition of Done**
- Works on Safari iOS

@codex please begin work on this task
"@
  },
  @{
    t="OSM Overpass: nearest golf course (30 km) & display name";
    l=@("feat");
    b=@"
**Goal:** From GPS, query Overpass for nearest `leisure=golf_course` within 30 km; display course name only. Fallback to city + manual search.

**Acceptance Criteria**
- Handles node/way/rel center
- Graceful fallback when none found

**Tasks for Codex**
1) Overpass query
2) Haversine sorting
3) Fallback UI

**Definition of Done**
- Course name shows in top bar

@codex please begin work on this task
"@
  },
  @{
    t="Open-Meteo client: current + next-hour & precip sums";
    l=@("feat");
    b=@"
**Goal:** Fetch current + hour+1 for wind/gust/temp/feels/humidity/UV/cloud; compute precip 24h sum, next 1h, next 3h.

**Acceptance Criteria**
- Type-safe responses
- Error/backoff handled

**Tasks for Codex**
1) API client + types
2) Transform functions
3) Cache/backoff logic

**Definition of Done**
- Unit tests for transforms

@codex please begin work on this task
"@
  },
  @{
    t="Wind module: speed/gusts + phone-relative arrow (approximate)";
    l=@("feat");
    b=@"
**Goal:** Show wind speed/gusts and render an **approximate** arrow relative to user heading.

**Acceptance Criteria**
- iOS motion permission flow with 'Enable Compass' button
- Uses available heading (webkit or alpha). If unavailable, show cardinal-only arrow with note
- Smooth rotation <300ms

**Tasks for Codex**
1) Permission handler
2) Heading provider
3) Arrow component + animation

**Definition of Done**
- Manual rotation test passes

@codex please begin work on this task
"@
  },
  @{
    t="Tiles: Temp+Feels, Humidity, UV+Cloud with 'in 1 hour' values";
    l=@("feat","design");
    b=@"
**Goal:** Compact tiles with large numbers, tiny labels; include 'in 1 hour' micro-values (▲▼→).

**Acceptance Criteria**
- Fits single screen with wind module
- Updates on refresh cadence

**Tasks for Codex**
1) Tile components
2) Delta computation & indicators

**Definition of Done**
- Visual pass on iPhone 14

@codex please begin work on this task
"@
  },
  @{
    t="Precip chips: 24h sum, next 1h, next 3h";
    l=@("feat");
    b=@"
**Goal:** Compact chips for precip windows.

**Acceptance Criteria**
- Units respect Imperial/Metric
- Tiny, non-blocking loading/error states

**Tasks for Codex**
1) Chip components
2) Aggregation logic

**Definition of Done**
- Matches API data samples

@codex please begin work on this task
"@
  },
  @{
    t="Units toggle (Imperial/Metric) with persistence";
    l=@("feat");
    b=@"
**Goal:** Toggle units and persist in localStorage.

**Acceptance Criteria**
- All values switch instantly
- Preference persists across reloads

**Tasks for Codex**
1) Unit helpers
2) Top-bar toggle UI

**Definition of Done**
- Unit tests for conversions

@codex please begin work on this task
"@
  },
  @{
    t="Hacker-style refresh + 'Last updated' text";
    l=@("design","feat");
    b=@"
**Goal:** Animate quick 'scan/type-in' on refresh; show exact 'Last updated HH:MM:SS'.

**Acceptance Criteria**
- Animation <300ms
- Manual refresh button

**Tasks for Codex**
1) Animation utility
2) Timestamp formatter
3) Manual refresh

**Definition of Done**
- No layout shift on update

@codex please begin work on this task
"@
  },
  @{
    t="Tests: unit (math/transforms) + Playwright smoke (iPhone 14)";
    l=@("test");
    b=@"
**Goal:** Minimal coverage for math and an e2e smoke at iPhone-14 viewport.

**Acceptance Criteria**
- Unit tests: wind-arrow math, unit conversions, precip aggregation
- Playwright CI asserts core tiles render

**Tasks for Codex**
1) Add Vitest + Playwright
2) Write basic tests
3) GitHub Action workflow

**Definition of Done**
- CI green

@codex please begin work on this task
"@
  },
  @{
    t="Accessibility & performance polish (WCAG AA, LCP budget)";
    l=@("accessibility","performance");
    b=@"
**Goal:** Ensure contrast, focus, ARIA; keep LCP < 1.5s, bundle lean.

**Acceptance Criteria**
- Lighthouse a11y ≥ 90
- LCP < 1.5s on 4G profile
- Bundle within agreed limits

**Tasks for Codex**
1) A11y audit fixes
2) Perf tweaks

**Definition of Done**
- Metrics noted in README

@codex please begin work on this task
"@
  }
)

# --- Create issues ---
foreach ($it in $issues) {
  New-Issue -title $it.t -body $it.b -labels $it.l
}

Write-Host "`nAll set. Repo, milestone, labels, and issues created for $Owner/$RepoName.`n"
