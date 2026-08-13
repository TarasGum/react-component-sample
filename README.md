# Component sample

Four React components taken out of a production app, with the tests that guard
them and a page that renders them.

They are the ones running in production, unchanged apart from names: the app's
own domain wording has been replaced with neutral terms, and the interface text
is in English. The comments explaining why each component is shaped the way it is
came with the code.

This folder is standalone. It talks to no server; what it renders is fixtures in
`src/demo-data.ts`.

---

## Run it

Requires [Bun](https://bun.sh) (`brew install oven-sh/bun/bun`). Node works too —
the scripts are plain Vite, Vitest and Playwright, so swap `bun` for `npm run`.

```bash
bun install
bun run dev          # the page, on http://localhost:5190
```

```bash
bun run test         # 27 unit tests (Vitest + Testing Library, jsdom)
bun run typecheck    # tsc -b
bun run build        # typecheck + production bundle

bunx playwright install chromium   # once, if you have never run Playwright here
bun run test:e2e     # 18 browser tests, twice over: desktop and a Pixel 5
```

`bun run test:e2e` starts the dev server itself and stops it afterwards.

---

## What is in here

```
src/components/
  day-strip.tsx        the dates, as a strip a thumb can flick through
  question-view.tsx    one question — three kinds, two states
  countdown.tsx        time left before a deadline
  plan-progress.tsx    "23 / 30" against an agreed target
  formula.tsx          LaTeX inside question text, typeset with KaTeX
  ui/                  the three design-system primitives those four lean on

src/lib/
  calendar.ts          timezone-correct date arithmetic (one configured zone, not the browser's)
  days.ts              which entries fall on a day, and which days get a dot

src/app.tsx            the page that renders all of it, light and dark
src/theme.css          the palette, as Tailwind v4 tokens
e2e/showcase.spec.ts   what a real browser has to confirm
```

### The four

**`DayStrip`** — a horizontal strip of dates. It replaced a week grid: seven
columns of hours told somebody with two entries a week almost nothing, and it was
the widest thing on the screen. Every date it draws is computed in the calendar's
own timezone rather than the browser's, so two people in different zones see the
same day, and a 17:00 entry stays on its own date on both sides of a clock change.
A dot marks the days worth a tap — red when something on that day needs
attention.

**`QuestionView`** — one component for the three kinds of question (single
choice, matching, numeric), in both states: open, and submitted. On the results
screen only two rows are ever coloured, the answer given and the right one;
reddening every option the user did not pick says "three mistakes" about a
question with one answer. The numeric field carries a minus button, because the
keypad iOS gives `inputMode="decimal"` has a comma and no minus — a negative
answer is otherwise impossible to type — and it sends the number on a pause
rather than per keystroke, because three writes can land out of order and record
"228" as "22".

**`Countdown`** — the time left before a deadline the server already decided. The
hour gets a field of its own as soon as there is one: "119:51" reads as two
different numbers depending on who is looking.

**`PlanProgress`** — progress against an agreed target. With no target it renders
nothing at all, because an empty track reads as "no progress", which is the
opposite of what an unset target means.

---

## About the tests

The split is deliberate: **jsdom owns the logic, the browser owns the layout.**

`src/**/*.test.tsx` asserts what the user sees and what the component sends
back — which rows are coloured after submitting, that a half-typed minus sign is
never saved, that a cancelled entry leaves no dot, that the strip opens on the
calendar's date when the browser disagrees. Each test names the decision it
guards; several name the bug that produced it.

`e2e/showcase.spec.ts` checks what only exists once the page is painted: that the
KaTeX stylesheet arrived, that nothing scrolls the page sideways, and that the
touch sizing keyed to `@media (pointer: coarse)` really reaches 44px on a phone
while a narrow desktop window keeps the compact controls. That last one is why
the Playwright config runs every test twice, under both pointer types.

Nothing here tests that a prop arrives where it was put.

---

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Base UI · KaTeX · Vitest +
Testing Library · Playwright

In the app they came from, these components sit under TanStack Router and Query,
and their types are inferred end to end from the API, so renaming a field on the
server breaks the frontend build rather than the running page. That plumbing is
not in this sample; `src/types.ts` writes out the slice of it these four read.
