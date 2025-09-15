# ADR-013: Frontend Framework Choice

## Status
Accepted

## Context
We need to select a frontend framework for:
- The **public landing page**, which must be SEO-friendly, globally fast, and low cost to host.
- **Platform apps** with TypeScript frontends, which must support authenticated users, integrate with backends via CQRS projections, and remain decoupled from one another (Style C).

We want:
- Compatibility with **Cloudflare serverless deployment**.
- Strong **TypeScript support**.
- Ability to support **SSG, SSR, ISR, and CSR** rendering modes as appropriate.
- Large ecosystem and community to reduce risk.
- Simplicity (avoid introducing multiple frontend frameworks if not necessary).

## Decision
We will standardize on **Next.js** for both the **landing page** and any **TypeScript-based apps**.

- **Landing page**: will use **SSG/ISR** for SEO and performance.
- **Apps**: will primarily use **CSR** for interactive features and authenticated user flows, with SSR where faster initial render is needed.

Deployment target: **Cloudflare Pages/Workers** using the `@cloudflare/next-on-pages` adapter.  
Styling: **Tailwind CSS**.  
Shared UI: A **common React UI component library** (e.g. `@platform/ui-navbar`) will provide optional shared navigation and design consistency.

## Rationale
- **Single framework reduces complexity**: avoids maintaining both Next.js and Remix/Astro.  
- **Flexibility**: Next.js supports all rendering modes (SSG, SSR, ISR, CSR), so we can choose per page.  
- **Cloudflare compatibility**: `next-on-pages` makes Next.js a first-class citizen on Cloudflare.  
- **Ecosystem**: Next.js has a very large community, many plugins, and robust TypeScript support.  
- **Consistency**: All frontends (landing + apps) can share a common component library, dev workflow, and hosting/deployment pipeline.  

## Consequences
- Developers need to learn and follow **Next.js idioms** (`getStaticProps`, `getServerSideProps`, ISR APIs).  
- We do not get Remix's built-in route loader model, but can replicate SSR/CSR patterns easily with Next.js.  
- All apps will align on React + Next.js, which slightly reduces flexibility for teams who may want Vue/Svelte in the future (though still possible as standalone apps).  
- This decision maximizes **short-term velocity** and **ecosystem leverage**, at the cost of potential long-term heterogeneity.

## Alternatives Considered
- **Remix**: better edge-first and route loaders, but smaller ecosystem.  
- **Astro**: excellent for landing pages but less suited for interactive apps.  
- **Mixed approach** (Next.js for landing, Remix for apps): increases complexity without a clear short-term benefit.  

