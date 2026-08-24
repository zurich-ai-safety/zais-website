# Original site inventory — zurich.aisafety.ch

Captured 2026-08-24 from the live Squarespace site. This is the content contract for the
prototype: **same content, same structure, new design.**

---

## 1. Site-wide

| Item | Value |
|---|---|
| Site title | Zurich AI Safety |
| Domain | zurich.aisafety.ch |
| Platform | Squarespace 7.1 |
| Footer | `© Website designed by Zurich AI Safety, 2025` — single centred line, no links |
| Favicon | none (Squarespace default) |
| Meta description / OG tags | none on any page |

### Navigation (header)

Text wordmark **"Zurich AI Safety"** on the left, links on the right:

| Label | Path |
|---|---|
| Home | `/` |
| Events | `/events` |
| AI Futures | `/ai-futures` |
| Fundamentals Programme | `/agisf` |
| Discussion Group | `/discussion-group` |
| ML bootcamp | `/ml-bootcamp` |

The "More" dropdown seen at narrow widths is Squarespace overflow, not a real menu — it only
ever contains "ML bootcamp". There is also a `/cart` icon (unused) and an orphaned `/shop`
page with 2022 conference tickets priced in GBP — neither is in the nav. **Out of scope.**

### Current visual language (what we are replacing)

- Background `#135367` (deep teal), all text white
- Headings: Poppins 700 — h1 renders at ~102px, h2 ~68px at a 1280px viewport
- Body: Archivo 400, ~25px, line-height ~2.0
- Every section is full-bleed, centre-aligned, single column

### Recurring external links

| Target | URL |
|---|---|
| WhatsApp Community | `https://chat.whatsapp.com/HWwskmj1pO4B9sbEyP1Khk` |
| Luma calendar | `https://luma.com/zais` (also written `https://lu.ma/zais`) |
| Luma embed | `https://lu.ma/embed/calendar/cal-jsHCkgSvHjHTPe9/events` |
| AISF curriculum | `https://course.aisafetyfundamentals.com/alignment` |
| BlueDot Impact | `https://bluedot.org/courses/technical-ai-safety` |
| ARENA | `https://www.arena.education/` |

---

## 2. Home (`/`)

13 sections, top to bottom:

1. **Hero** — h1 "Let's make sure AI development happens safely."
2. **Intro paragraph** — "We are a group of students, researchers, and professionals interested
   in, and working on the long-term safety of artificial intelligence. Our goal is to help
   ensure that future powerful AI systems are safe. For those who are new to AI Safety, we
   provide an AI Safety Fundamentals course. Furthermore, we run a seminar where we read and
   discuss recent research papers, we sometimes collaborate on research projects and more!"
3. **Get involved!** — this one section holds four things:
   - Illustration (editorial collage, "McQuade Genius Spot Illo")
   - h2 "Get involved!"
   - "Join our [WhatsApp Community] to stay informed about future events and programs."
   - **4-item accordion**, each collapsed to a title, expanding to a blurb + CTA:

     | Title | CTA target |
     |---|---|
     | AI Futures Discussions | Learn More → `/ai-futures` |
     | AI Safety Fundamentals Course | Learn More → `/agisf` |
     | Paper Reading Group | Learn more → `/discussion-group` |
     | Research | *(no CTA)* |

   - h2 "Upcoming Events" + Luma calendar iframe
4. **h2 "Some cool projects from our members"**
5. **Eight paper sections** (one per Squarespace section). Each = thumbnail image linking to
   arXiv + h4 title + authors line + an "Abstract" accordion holding the full abstract.

| # | Paper | Link |
|---|---|---|
| 1 | You Didn't Have to Say It like That: Subliminal Learning from Faithful Paraphrases | arxiv.org/abs/2603.09517 |
| 2 | GT-HarmBench: Benchmarking AI Safety Risks Through the Lens of Game Theory | arxiv.org/abs/2602.12316 |
| 3 | Evaluating Superhuman Models with Consistency Checks | arxiv.org/pdf/2306.09983 |
| 4 | Intent-aligned AI systems deplete human agency… | arxiv.org/pdf/2305.19223 |
| 5 | Red-Teaming the Stable Diffusion Safety Filter | arxiv.org/pdf/2210.04610 |
| 6 | Training Language Models with Natural Language Feedback | arxiv.org/pdf/2204.14146v2 |
| 7 | Exploring Adversarial Attacks and Defenses in Vision Transformers trained with DINO | arxiv.org/pdf/2206.06761 |
| 8 | Challenges for Using Impact Regularizers to Avoid Negative Side Effects | arxiv.org/pdf/2101.12509 |

6. **Footer**

No contact form on the home page.

---

## 3. Events (`/events`)

Shortest page. h2 "Join the discussion on AI Safety at one of our upcoming events." plus one
paragraph: "Check out our calendar for all our upcoming discussions, hackathons and social
events! You can see past events and subscribe to the calendar using [this link]" →
`https://luma.com/zais`. Plus the Luma embed.

---

## 4. AI Futures (`/ai-futures`)

- h1 "AI Futures"
- h4 "Discussion groups making sense of AI's trajectory March - May 2026, sign-up on Luma"
- **What?** — three paragraphs on the six-part series
- **Who?** — one paragraph, "No technical background is required."
- **When & Where?** — 5-item dated session list (Feb 26 kickoff, Apr 2 forecasting,
  Apr 23 alignment problem, May 7 governance, May 21 strategic planning), then
  "Location: Events will take place in ETH HG. Register on Luma to see the location."
- **Get in touch!** form: Name (first/last), Email, Subject, Your Background, Message

> Note: the intro promises a "six-part series" but only 5 sessions are listed.

---

## 5. Fundamentals Programme (`/agisf`)

- h1 "The AI Safety Fundamentals Programme."
- h4 "A 6-week programme that introduces you to the fundamentals of AI safety and current issues."
- **What?** / **Who?** / **When?** — When? holds three dated lines: intro evening
  Thu Feb 26 18:30 (Luma link), application period Feb 26 – Mar 8 (Google Form link),
  programme runs Mar 16 – May 1
- **Curriculum** — two paragraphs, then h4 **Overview**, h4 **Expectations**
- **Resource** — link out to the AISF alignment curriculum
- **Key Topics** — 7 units numbered 00–06, each a title + question + description:
  00 AI and the years ahead · 01 What is AI alignment? · 02 Reinforcement Learning from human
  (or AI) feedback · 03 Scalable oversight · 04 Robustness, Unlearning, and Control ·
  05 Mechanistic Interpretability · 06 Technical governance approaches
- **Interested in Facilitating?** — intro + 4 bullet criteria + form
  (Name, Email, Subject, Message)

> Notes: `<title>` is "Services 4 — Zurich AI Safety", a leftover template default. The
> "Key Topics" grid is 7 units numbered 00–06 laid out in two columns, so DOM order does not
> match reading order — the numbering itself is correct. The "When?" section also contains an
> **empty Squarespace calendar block** (renders the current month with zero events); it is a
> dead widget, not content.

---

## 6. Discussion Group (`/discussion-group`)

- h1 "The Paper Reading Group."
- h4 "Our on-going discussion group for those interested and familiar with AI safety topics."
- **What?** — two paragraphs + 4 sample papers (Sleeper Agents, R-Tuning, Towards Guaranteed
  Safe AI, AGI Ruin) each linked to arXiv/LessWrong
- **Who?** — three paragraphs, ends "fill out the form at the bottom of this page"
- **When & Where?** — Luma calendar + WhatsApp community links
- **Get in touch!** form: Name (first/last), Email, Subject, Your Background, Message

---

## 7. ML bootcamp (`/ml-bootcamp`)

- h1 "Alignment Research Engineer Accelerator."
- h4 "An ML engineering program that provides the skills, tools, and environment for upskilling
  in technical AI safety."
- **What?** — opens with a stale notice: "The ARENA ML-bootcamp will not be offered in Fall
  2025." Then three paragraphs on ARENA.
- **Who?** / **When & Where?** — the latter still says "During the spring semester of 2025"
- **Curriculum** — 4 chapters (0 Fundamentals, 1 Transformers & Mech Interp, 2 Reinforcement
  Learning, 3 LLM Evaluations), each with a description + link to the ARENA Streamlit app
- **Get in touch!** form: Name, Email, Subject, Your Background, Your ML experience,
  Your coding experience, Message

> Note: this page is a year out of date.

---

## 8. Forms

Four Squarespace form blocks, all headed "Get in touch!" (h2, except AI Futures where it is an
h1). Fields vary per page — see each page above. All are Squarespace-native, so we need a
replacement backend (Formspree / Netlify Forms / Google Form / mailto) before launch.

## 9. Assets

Images all live on `images.squarespace-cdn.com` under account `630faa5f8e8f082d47ba0824`:
one hero illustration + eight paper thumbnails. The hero is a stock editorial illustration —
**check licensing before reusing it** on the new site.

## 10. Open questions before building

1. Where do form submissions go once we leave Squarespace?
2. Keep the hero illustration (licensing?) or replace it?
3. Fix stale content (ML bootcamp dates, "six-part series" vs 5 sessions, "Services 4" title)
   now, or port verbatim and fix later?
4. Drop `/shop` and `/cart` entirely — confirm.
