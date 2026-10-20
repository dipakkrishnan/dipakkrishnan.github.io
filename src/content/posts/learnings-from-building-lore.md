---
title: "Learnings from building Lore"
slug: "learnings-from-building-lore"
date: "2026-10-20"
summary: "Lore is a marketplace that lets people sell their personal experience to agents. The thesis behind it, and what we learned taking it from coding agent skills to a desktop app."
tags: ["ai", "agents", "marketplaces", "lore"]
draft: false
---

Lore is a marketplace that lets users sell their personal experience to agents. We just shipped the first version of Lore with its own interface! Towards the end of bug fixing and dogfooding the release, I thought it might be useful to catalogue the evolution of Lore, from idea to app. This essay will document the broad trends that formed the thesis behind building Lore in the first place and the product & engineering learnings along the way.

### Personal agent takeoff

Everyone will soon have a personal agent with ultimate context about who they are. This includes preferences on *everything* from shoes you want to buy to sushi spots you've been meaning to try to bucket list travel destinations.

Muse, Grok Bot, Instinct, and Dots are the first incarnations of personal intelligence, and the market will go through multiple shifts before it's defined. But ultimately, I think that the number of agent-led Internet interactions through these personal bots will far exceed human-led interactions by multiple orders of magnitude. To me, this means that private context is going to drastically increase in value. Why?

- Pre-training slurps up only the *public* Internet
  - LLM pre-training produces models that have a static knowledge distribution. Most value comes from in-context learning: agents operating on dynamic, private context to accomplish tasks
    - Connecting AI to private codebases, documentation, PRDs, and knowledge work warehouses (Notion, Drive etc) has been the unlock
    - Especially on tasks that fall out-of-distribution (not math or coding), high-quality private context is *necessary* for models to be useful
      - True across sales, legal, finance, architecture, design etc.
- Human knowledge is exceptionally valuable and will be increasingly scarce
  - Numerous examples of platforms that either monetize expertise successfully or provide tools for users to do so
    - Substack, Gumroad, Masterclass etc.
  - RL training is mostly about expert human knowledge acquisition
    - The burgeoning data business around expert judgement shows the value of human cognition
      - Non-verifiable domains require expert data for AIs to eventually execute tasks on the level of the best humans
  - Human preference data is impossible to replicate
    - "AI cannot eat the ice cream for you" - Gwern
    - Anyone looking to build a better model of the world's population cannot easily access human preferences
      - Hypothesis: willingness to pay for context *exists* iff
        - Context is priced reasonably
        - It actually moves the needle for a buyer agent in terms of producing an outcome
      - Simulation will always lag real data in predictive power
      - No existing player with enough user data will sell it due to legal/backlash concerns
  - AI content is already flooding the Internet, scarcity of private human context increases its long term value

I think if you zoom out, it's clear that there will be a market for every person's knowledge base - both experts and non-experts alike. There's no avenue for an agent to buy human judgement today while working on a task. Lore exists to plug this gap. It provides:

- A simple interface for context sellers that supports the following operations
  - Connect personal knowledge and agents to Lore
  - Draft publications to sell to interested parties
  - Incorporate financial infrastructure to facilitate payouts
- A marketplace for buyers to discover and pay for context that fits a task that they're trying to complete
  - Browser-native discovery for personal agents
  - JSON marketplace registry of paid MCP Lore nodes and metadata surrounding it
    - Included MCP bridge to connect to seller MCP nodes

The bet is forward-looking but nearer than you might think. Lore is neutral - even if every personal agent platform bakes in monetization (which I expect to happen), monetization tools will only be available to each personal agent's users. Neutrality is useful because I think agentic commerce will require open standards for engagement. For example, protocols like [PACT](https://decagon.ai/blog/introducing-the-personal-agent-consent-trust-protocol-pact) and [PAP](https://sierra.ai/blog/introducing-personal-agent-protocol) from Decagon and Sierra are open agent standards for commerce and identity that Lore can readily adopt. I liken it conceptually to DeFi vs. CeFi in the sense that Lore intentionally works on open rails (MCP, x402, MPP if needed etc) and sellers can reach any agent in the marketplace. Lore's registry of sellers is the only centralized component of its setup, but any agent can freely read it.

### Modeling a two-sided marketplace

Lore is naturally a two-sided marketplace - it supports seller needs first and provides lightweight infrastructure for buyers second. The obvious place to start was the seller experience because you need the context first, before anyone will pay for it. The key components to nail were:

- Onboarding ease and connecting context sources as fast as possible
  - Warm starts the user's experience with Lore by pulling in context from their apps and agents
    - Opinionated paved path through the product vs. letting the user "figure it out"
    - Shortens time to publication
      - User opens Lore → immediately connects their context sources → sets up their store → pushes to it in their first product interaction
      - Success = done the fewest number of clicks possible
- How do I get paid?
  - Any user's first question once they set up their context (or maybe even prior to that)
  - Payment rails need to be clear to the user and obvious to set up
  - Main decisions around the payment experience bias towards simplicity
    - Seller sign-up must be lightweight (and leverage trusted players where necessary like Stripe)
    - Lore holds no money
      - Fewer headaches, less work…
    - Supports micropayments
      - Some educated guesswork here in terms of what a given piece of context, in isolation, is worth (initial intuition was a small amount)
      - This ended up being a contentious decision which I go through below!
- Designing the experience with an agent at the core
  - Essential to onboarding the user smoothly
    - Lore Agent is aware of its runtime and can troubleshoot when the user runs into issues with connectors or setup
  - Key to drafting
    - Raw context can be messy and require synthesis e.g. notes, call transcripts, rough draft agent memories
    - Agent transforms context into *sellable assets*
      - Agent has reasonable assumptions baked in on what buyers want, sensitive data, pricing etc.
      - User always maintains ultimate control over for-sale content - approving only what they want to sell

Once we felt good about a system that satisfied the above, we hypothesized that the ideal buyer experience needed to center around discovery and trust. Buyers needed to search for a seller that might have the context necessary for their task and also had to trust that their money was well-spent.

We converged on three ideas to address this - a centralized MCP registry to facilitate easy vendor discovery, a limited set of free context previews, and seller reviews (still to come!). Context previews allow buyers to assess relevance before they purchase an item, which is central to trust. Without previews, buyers risk getting burned by purchasing irrelevant context. At a low enough price point, this is potentially tolerable but becomes untenable when prices rise and/or transactions span bundles of context. Reviews mirror information discovery experiences today - human consumers assess the quality of vendors via consensus mechanisms, and are incentivized to leave reviews because they benefit from others doing so. We feel the same mechanism will carry over to agent consumers.

Today, many parts of the buyer experience (including some of the above!) are part of future work. The lion's share of focus has gone to the seller app, which has gone through significant evolution over time. The sections below document each iteration and specific considerations we took as we built.

### The evolution into a desktop app

#### V1: Coding agent UI as the interface

When we originally conceived of Lore, we thought it would be easiest to build with coding agent abstractions. Claude Code's TUI was rich enough to start building and the agent was the core of the experience already, so we needed to bootstrap the context around it. That's the promise of the coding agent runtime. It gives you voice mode and it naturally provides extension points via skills and plugins. You also get distribution via marketplaces. Browser use would later come for free as well and you receive the huge benefit of meeting people where they are (not all people, as I'll later touch on). We started with a series of skills:

- `lore-onboard`
  - Persona interview to produce a blueprint file of what the seller wants their lore to be
    - Gamified because it's fun
    - Actuated via `AskUserQuestion` in Claude Code or equivalent in other harnesses
  - Agent reads the user's sessions from Codex/Claude Code if they exist (easily extendable to Hermes, Pi or other local agents) and proposes a memory profile for them to review
  - Installs a synthesis automation/scheduled task that runs weekly and rolls up new potential Lore from user sessions
- `lore-capture`
  - Transforms dictation, text, files, folders, and images into private memories that the seller can review and update as they wish
- `lore-publish`
  - Drafts 1-3 publications from the seller's private library that the seller can approve
- `lore-enable-payments`
  - Facilitates payments via a deployed Cloudflare worker
  - Receives payments via USDC on Base and sends them to a payout address the user controls with full testing built in
- `lore-buy`
  - Buyer skill to find relevant sellers, read their free catalogs and buy within the buyer's budget
  - Harness-agnostic

The operations that altered state such as deploying context to a Cloudflare worker or saving a blueprint all go through the Lore CLI. The CLI owns commands to sync data from connectors, search over stored memories, CRUD operations over the user's stored profile, provenance for routing memories to sources, infrastructure management and more. It also handles permissions. A caller agent can draft publications, but the owner must approve to deploy sensitive context to the Lore storefront. Private memories stay local as a default. This is still true today - every interface for Lore still talks to the CLI first.

Cloudflare's infrastructure and agent SDK made it easy to stand up an MCP node that required payment. Lore uses two abstractions of Cloudflare's agent SDK running on a Cloudflare worker (which is just cheap compute running a JavaScript runtime). `McpAgent` runs the MCP server on the worker and `withX402` wraps a native tool call with the x402 protocol. The way x402 works is simple: a buyer calls a paid tool and receives a 402 Payment Required response with pricing and payment metadata. The buyer signs a USDC payment and retries its original call with the payment attached and once the payment is validated, the tool returns the result. Cloudflare handles the server-side x402 abstractions, but also has a client-side utility (`withX402Client`) that was baked into the buyer bridge we wrote.

The final piece of V1 was payments. We debated about the UX of crypto vs. card-based payments for a while. Ultimately, card-based payments were familiar to a large majority of users and crypto was not, but there were a number of motivations that led us down the crypto path first. I'll later touch on why I think this was reasonable at the time, but incomplete on its own.

- Micropayments were tractable
  - Card charges cost roughly $0.30 + 2.9% and Stripe won't charge less than $0.50
  - Pricing context at incredibly low prices is thus intractable
- No custody
  - Fewer headaches around holding money
  - I didn't want to build a payments platform, just a marketplace
- No seller signup
  - Payout address was all that was required to get started for existing crypto users (new users would have to set up a wallet)
- Naturally worked with x402 and was the lowest lift option
  - See Cloudflare's infra points above

We shipped with Coinbase support (as an aside, UX was a huge hassle to get users to leave the runtime and come back, a downside of integrations) because of these reasons, and got a few users to test out Lore.

#### User learnings

The general premise of Lore was compelling to an initial set of users and was enough to get them to try it. They quickly encountered problems:

- Lack of understanding around where to start
  - What do buyers want that I can hook into?
  - Common user sentiment - "I open Lore… and then what?"
- Too many hops to set up the necessary infrastructure
  - Skill installation → Cloudflare setup → Coinbase setup were key drop off points that the user had to navigate themselves
- Coding agent interface is unfriendly and unopinionated
  - Initial users were not devs
- Unclear how to connect Lore into where they do work
  - Coding agents *can* do this with MCPs but terminal-based UX makes this very opaque
- Questions about data sensitivity and what was actually for sale vs. kept private

The biggest takeaway was that the interface did not fit the user. Regardless of whether coding agents *can* connect to almost every knowledge warehouse in existence, the salient point was that users didn't want to open a Terminal and they didn't want to *figure it out*. Almost every piece of feedback rolled up to this point.

It sounds trivial, but an opinionated interface matters a lot for a tool that has a scoped purpose like Lore. Claude Code works because devs are power users and there's an inherent appeal to poking and pushing the tool for its own sake. Most knowledge workers/people aren't like this and want a paved path. That wasn't possible to do without owning the interface by which people stored memories and then sold them. Building a bespoke interface around Lore also afforded more control to the seller. They could see exactly what memories were for sale and easily take down data from the remote node that they didn't want to sell.

#### V2: A desktop app and a marketplace

After reading through user feedback, we started building a desktop app for Lore. We considered a website but generally felt that a desktop app that had access to your local files was necessary. The reasoning was that knowledge work tools like Obsidian, Claude Code, and Codex were local-first and had files that Lore could immediately read. A desktop app also obviated the need for OAuth or user uploads of local sources to a website, which felt premature and a potential source of drop off. Finally, the desktop app allowed Lore to treat context as private by default, giving the user ultimate control over what parts of their inventory they put up for sale vs kept private. We built the app on Electron and backed memories with a SQLite database on disk.

![The Lore desktop app's Today view](/images/lore/lore-today.png)

The system, as of today, is laid out below.

<a href="/images/lore/lore-architecture.png"><img src="/images/lore/lore-architecture.png" alt="Lore system architecture" class="wide" /></a>

There were a number of interesting technical details during the build.

**Agent runtime**

Pi was the clear choice of agent runtime, mostly due to its simplicity and interoperability across models. It also worked natively in JavaScript environments. Lore requires a basic computer-using agent with tunable built-in primitives for compaction and context management. I considered building on the Claude Agent SDK or Codex SDK, but API differences make it quite hard to swap another provider's model into either SDK.

Interactions between user and the Lore Agent are stored in sessions - running logs that capture a full agent conversation. Session management ships with Pi - a session is just an append-only JSONL file on disk. Lore keeps them in `~/.lore/.pi/sessions/<task>/` with a folder per task-type: capture, setup, publish and deploy and more. Persisting on disk was necessary to make tasks survive an app restart. Follow-ups on finished tasks used Pi native forking so that a finished task branched from the old session and started a new session file.

Customizing behavior depending on where the user was in their journey was trivial - the skills we had built prior in the coding-agent-only experience could be re-purposed around Pi. We built a suite of custom tools on top of the usual `bash`, `read`, `write`, `edit` tools that mapped directly to the needs of the user:

- `ask_user` so that the model could call when user input was required
- `propose_memories` to draft 1-5 memories, corrections go back to the agent
- `propose_blueprint` to draft the onboarding blueprint that the owner can edit
- `save_profile` saves a synthesis profile from the user's onboarding answers
- `propose_price` that a piece ships with, this is the only way the app sets a price
- `cloudflare_login` starts Cloudflare's sign-in in the browser
- `open_url` brings the user to the browser easily if needed
- `open_store` deploys a user's store
- `memories_ready` reports a background run's output - number of connected items read and memories written, hooks into main UX
- `check_in` catalogues answers from an evening check in and allows the agent to proactively notify a user about a new sellable asset
- `finish_task` signals to the app that a task is complete

This toolset covers most of the surface area that the agent is responsible for - from helping the user onboard efficiently to drafting high-quality publications on a recurring basis.

**Sandboxing**

Sandboxing is built on Anthropic's `sandbox-runtime`. It's the same library that Claude Code uses to sandbox its `bash` tool. It wraps shell execution with a list of rules denoting file system permissions, network access and per-command control. The way it works is that rules are defined with abstractions like `denyRead`, `allowRead` and `allowWrite`. The `sandbox-runtime` then turns the rules into a Seatbelt profile on macOS. Seatbelt is macOS's own sandbox. So unauthorized executions get denied directly by the kernel with error messages that flow back to the model.

The library allows Lore to configure explicit rules on file system access - the user's home folder is inaccessible via `bash` or any file tool except for Lore's data, the app and Claude Code/Codex memories. Writes are limited to Lore's folder only. Network is cut off except when managing store deployments. Lore's agent cannot approve its own publications - approving a publication requires a secret key that sits outside the sandbox and is never accessible to the agent.

**Multimodal input**

Dictation was especially important to build in a lightweight way. Lore uses `whisper.cpp` bundled into the app and runs inference locally when the user finishes recording. It uses the `base.en` model through the Metal build of whisper so it gets the benefit of acceleration on Mac GPU. It runs reasonably fast and is relatively accurate (haven't benched it, but no issues so far). Dropped images and files get read by the agent natively in app and are filtered for credentials.

**Connectors**

Context sources vary widely in terms of ease of access to the underlying data. Substack publishes an RSS feed, Obsidian has local files, Notion has an MCP as does Granola. But there isn't a unified access point for LinkedIn or X (outside of browser use, X's MCP costs $) and ChatGPT/Claude offer exports, which isn't awesome UX.

![Lore's connectors](/images/lore/lore-connectors.png)

All of these integrations (now 12, and quickly adding more!) were built from scratch. The hard part of this is building for each provider's quirks and tracking content state properly. This meant asking users when permissions to access folders on disk were required or navigating OAuth to connect to an MCP. Each item that gets pulled in receives a stable key and content fingerprint so Lore skips duplicate content and pulls in content that has changed. Ultimately, the more interesting work is in turning the context pulled from connected apps into sellable assets. This happens in two layers:

- On connect
  - Lore Agent immediately drafts the content it finds into memories
- Background automations
  - Read connected apps daily when the user's laptop is on and catch up if not
    - Sweeps each app to find net new context and drafts it into memories for a user's review

![Memories in Lore's inventory](/images/lore/lore-memories.png)

**Personal agents as a source**

Bringing in context from personal agents was made easier by the fact that Lore stands up its own MCP server backing a Lore storefront. The work involved to integrate agents like Grok Bot, Claude and ChatGPT reduced to exposing a write surface for these agents to connect to. This is a different surface from the buyer-facing MCP, which is read-only and paid. The write surface exposes three tools:

- `store`
  - Saves a batch of memories (1-20 per call)
  - Each memory has a fixed schema
    - Title, content, topic, kind and a stable key associated with it
- `stored`
  - Returns a count of the agent's total saved memories
  - Given a key, returns the state of the key (conceptually like an inbox item with states like `waiting`, `received`, `forgotten`)
- `forget`
  - Takes back a key/associated memory
  - If the memory has been processed, queues it up for deletion, otherwise it is withdrawn

Each agent is given a private MCP link to the store with an embedded credential and communicates over streamable HTTP. Data is encrypted in transit between the agent and the Lore storefront and from the storefront to the Lore app running on the user's laptop. Lore's server keeps a hash of the credentials it issues to a writing agent. When an agent calls the API, it compares the caller's credential hash to a stored copy, and rejects writes that do not pass this check. A user's experience of integrating their agent starts with setting up the connection and ends with a prompt to the agent to set up a recurring task to push memories and accrued preferences to Lore. The result is that a seller's inventory grows naturally as they interact with their personal agents.

![Connecting a personal agent to Lore](/images/lore/lore-connect-agent.png)

![New memories saved by Grok Bot on Lore's Today view](/images/lore/lore-agent-saves.png)

### Focusing on payment friction removal

A key theme throughout building Lore has been removing friction from both the buyer and seller side. The clearest example of this is how we built payment rails. I wrote earlier about the logic behind choosing crypto rails to start with, and why I ultimately decided that this was incomplete on its own. While crypto rails were attractive for micropayments, they didn't meet users where they were. Users, for better or worse, are much more comfortable with traditional card-based payments.

Once we got initial signal on the crypto-induced friction from users, we moved quickly to set up Stripe Connect card-based payments. Stripe's infrastructure also satisfies Lore's core position of holding no money. Stripe Connect directly charges on the seller's Stripe account. Lore still supports the crypto path for micropayments (which I think ultimately is extremely agent-friendly and future-proof!).

Building a card-based payment path was not only a good decision for sellers, but disproportionately simplified the buyer experience. Agents are now highly capable of browser use tasks and personal agents are post-trained to actuate browsers efficiently. Instinct, with your approval, can complete transactions in its built-in browser with a card you give it access to. Muse and Grok Bot can do the same. We realized browser capabilities are now table stakes, which directly shifted our attention towards enabling known paths to purchase like Stripe/Link.

From a product standpoint, we are unopinionated about the "right" paths for buyer agents to transact with sellers. Both model capabilities & the agentic commerce ecosystem are changing too rapidly to hold opinions rigidly. As a result, Lore supports direct MCP connection and card checkout for buyers and will support any integration path that reduces friction for users. Ultimately, transaction volume will tell the tale.

### Future work

There are a number of interesting directions for Lore to take in the near future. I'll name some that are especially exciting to me.

**Collections & Feeds**

Lore today is organized into atomic memories. I think there is a shape of personal experience that looks more like a bundle and is priced as such. Since a seller's knowledge base is dynamic, feeds are the subscription layer that agents can use to fetch seller experiences on a recurring basis. Conceptually, collections and feeds would let buyers acquire a user's knowledge base or cluster of experiences in both a point in time or recurring manner (similar in nature to Substack where the writer's content is scarce, the same scarcity applies to Lore users - especially experts).

**Paying for outcomes**

A seller's Lore agent directly answers on their behalf given a buyer query. This would operate like a subagent - a buyer agent can execute a large task more cost efficiently and accurately by calling a Lore node. For user modeling and simulation, this could be especially compelling. Population level modeling needs preference data across thousands of users that can either be bought directly from MCP nodes or summarized by a seller's agent. Lore can help interested buying parties close the sim2real gap, while sellers receive compensation. It's also directionally aligned with work to improve buyer trust. A buyer is much more likely to return to a Lore node if a task is accomplished more efficiently (synthesis done on seller side) and at lower cost.

**Ambient/multimodal context**

Collecting ambient context (likely enabled by devices) reduces context-dumping friction on behalf of the seller and minimizes the time between context creation and sale. It also expands the modality of experiences a Lore seller could monetize to video, voice or images. I hypothesize that a simple use case like capturing videos or pictures from a trip and auto-monetizing them will be highly satisfying to the user.

**Proactivity to drive habituation**

Lore is "proactive" today through scheduled tasks that come pre-bundled with the app. These tasks mostly ensure that Lore has complete context over the apps that the user has connected to reduce friction in the memory creation process. More useful proactivity could look something like Lore searching on the user's behalf to answer what buyers on the marketplace currently want and notifying them to "spend 5 minutes with Lore" to talk through something Lore synthesized while the user was at work. The trick is to do this in a lightweight manner and avoid annoying the user with low-value notifications. As long as the user can make money from the time they spend in-app, it stands to reason that interacting with Lore could become part of their routine.

There are also more mechanical future items to work on that aid distribution.

- Windows/Linux support
- Muse connector support

Ultimately, the ecosystem around agentic commerce is still spinning up and numerous apps will enter the market to meet agent demand. I think Lore's building blocks are a promising first step to better serve human and agent users.

Download the app at [https://yourlore.dev/](https://yourlore.dev/), browse the marketplace at [https://yourlore.dev/marketplace](https://yourlore.dev/marketplace) and let us know what you think!
