# Unified Portfolio Design Reference Audit

Reviewed October 18, 2026 against the ten websites listed in BRIX Agency's machine-learning design collection and the deployed AI/ML Project Atlas.

## Executive recommendation

Use `ayush210895.github.io` as the single public entry point. The homepage should establish Ayush Soni, his applied AI/ML positioning, professional credibility, and strongest business outcomes before visitors enter the Project Atlas or Quality Lab.

Keep the interactive Atlas, case-study workbenches, and Quality Lab as deeper experiences inside one shared React application:

- `/` - professional portfolio and selected proof
- `/experience` - professional work and leadership
- `/projects` - searchable Project Atlas
- `/projects/:slug` - themed case studies
- `/lab` - interactive AI Quality Lab
- `/insights` - technical writing, experiments, and conference material
- `/about` - profile, resume, contact, GitHub, and LinkedIn

Repository names remain technical identifiers. Every public title should use a deliberate display name.

## Reference matrix

| Reference | Strongest current pattern | Useful for this portfolio | Avoid copying |
| --- | --- | --- | --- |
| [Scale AI](https://scale.com/) | Full-bleed real-world media, a consequential outcome-led headline, restrained navigation, and customer evidence | Lead with a clear applied-AI promise and pair it with a real artifact or operating context | Corporate scale claims, generic industry breadth, or imagery unrelated to Ayush's evidence |
| [GenerativeAI X](https://generativeaitemplate.webflow.io/) | Large type, image-led product tours, and generous section rhythm | Use short visual walkthroughs of actual project interfaces and outputs | Template copy, generic AI imagery, weak contrast, and decorative sections without proof |
| [Raycast](https://www.raycast.com/) | One memorable promise, disciplined dark canvas, compact navigation, and progressive product reveals | Give every flagship project one sharp promise followed by a working visual demonstration | Excessive empty space or product minimalism that hides technical depth |
| [Sleek X](https://sleektemplate.webflow.io/) | Dark/light balance, contained navigation, subtle grids, and colorful accents | Use restrained structure and accents to organize technical material | Template-first composition, anonymous visuals, and darkness without readable content |
| [Reflect](https://reflect.app/) | Distinctive atmosphere, tight visual identity, compact controls, and product-centered sections | Give the unified site a recognizable visual signature and use focused product scenes | Low contrast, mood replacing evidence, or ornamental glass effects throughout |
| [Rask AI](https://www.rask.ai/) | Immediate product demonstration, clear benefit, credibility signal, and strong primary action | Put a real interactive artifact or guided case demonstration in the first viewport | Consumer-style urgency banners and conversion language that feels inappropriate for a professional portfolio |
| [Prevalent AI](https://www.prevalent.ai/) | Editorial typography, distinctive illustrations, business-first language, and purposeful color | Give project families unique visual worlds while retaining a consistent shared shell | Sci-fi decoration that is not tied to the project problem or decision |
| [IntelliTech X](https://intellitechtemplate.webflow.io/) | Clean page inventory and reusable product-section structure | Reuse a consistent case-study grammar across all projects | Generic template identity and underexposed visual treatments |
| [OpenAI](https://openai.com/) | The product itself becomes the hero; minimal controls lead directly into interaction | Let visitors explore project evidence or ask guided questions instead of only reading descriptions | An open-ended chatbot without grounded portfolio data, evaluation, or clear visitor paths |
| [Darkweb X](https://darkwebtemplate.webflow.io/) | Bold dark palette and high-color product imagery in the original design system | Use saturated project accents selectively for artifacts and transitions | Decoration-only dark mode, empty hero space, and effects that obscure content |

## What the current Atlas already does well

- It has a coherent visual language rather than a generic template.
- It makes model evidence, trade-offs, operating decisions, and limitations visible.
- It provides working interactions through the signal field, case workbench, architecture flow, and Quality Lab.
- It distinguishes recruiter and engineer views.
- It gives projects individual accent colors while preserving a consistent shell.

## Current gaps

1. **The first viewport does not establish the person.** Visitors see a system map before they understand Ayush's role, experience, or professional point of view.
2. **The hero visual is abstract.** The network is interactive, but it does not immediately show a real model output, interface, architecture artifact, or business workflow.
3. **Repository counts are weaker than outcome proof.** `17 projects`, `12 evidence backed`, and `6 evaluation modes` are useful supporting facts, but professional impact and operating decisions should lead.
4. **The portfolio and Atlas compete as separate products.** They currently have different navigation, typography, visual identity, and storytelling priorities.
5. **The first viewport is visually narrow.** Most of it uses one dark teal family; project-specific color and artifact imagery arrive later.
6. **Professional trust signals are missing from the Atlas header.** Experience, resume, LinkedIn, and contact require leaving this experience.
7. **The strongest artifacts appear too late.** A real chart, interface, or evidence object should be visible before the first scroll.
8. **Not every repository deserves equal prominence.** Flagship case studies should lead; learning and supporting repositories should remain discoverable in the explorer.

## Proposed homepage

### First viewport

- Name: **Ayush Soni**
- Positioning: **Applied AI and ML systems for decisions that need evidence**
- Supporting line covering production ML, causal inference, GenAI/RAG, forecasting, NLP, evaluation, and stakeholder adoption
- Primary action: **Explore selected work**
- Secondary action: **Open AI Quality Lab**
- Utility links: resume, LinkedIn, GitHub, and contact
- A live artifact stage that rotates among a model decision surface, a grounded-answer trace, and a production architecture flow

### Proof immediately below

- Three professional impact statements grounded in verified experience
- Three flagship case studies: marketplace harm risk, credit-risk MLOps, and financial-document intelligence
- Each case shows the business question, one real artifact, the decision enabled, the production boundary, and the visitor's next action

### Remaining flow

- Experience timeline
- Project Atlas explorer
- Quality Lab demonstration
- Current learning and published insights
- Resume and contact close

## Visual system

- Use a dark foundational canvas with alternating light evidence sections.
- Keep one shared typography and navigation system across portfolio, projects, and lab.
- Give each flagship project a controlled accent palette and a relevant artifact style.
- Prefer real screenshots, charts, data objects, architecture states, and before/after decisions over abstract AI imagery.
- Use motion to reveal causality, flow, comparison, and state changes; never animate merely to fill space.
- Preserve readable contrast and reduced-motion behavior.
- Use rounded, asymmetric visual surfaces selectively; do not turn every section into a card.

## Recommended implementation order

1. Move the professional portfolio content into the React/TypeScript design system.
2. Replace the Atlas-first homepage with the unified professional homepage.
3. Preserve the current Atlas under `/projects` and Quality Lab under `/lab`.
4. Add real first-viewport artifact scenes drawn from existing public project evidence.
5. Consolidate navigation, metadata, accessibility, analytics, and SEO.
6. Publish the unified application from `Ayush210895.github.io` after side-by-side visual and content QA.

## Decision rule

The unified site should feel impressive because a visitor can inspect real work, understand the decision it supports, and verify the evidence. Visual novelty should amplify that proof, not compete with it.
