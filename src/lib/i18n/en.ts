import type { Dict } from './ru';

export const en: Dict = {
  meta: {
    title: 'Echelon Desktop — the personal assistant that remembers your whole business',
    description:
      'A personal assistant for the business owner. Lives on your computer, remembers people and agreements, collects the reports and answers clients itself. The demo is a 30-minute live call — nothing to install.',
  },

  nav: {
    cta: 'See a demo',
  },

  hero: {
    h1: 'I stopped carrying\nthe whole business in my head.',
    sub: 'Echelon Desktop is a personal assistant for the business owner: it holds your people and agreements in memory and does the routine itself. Remember Tony Stark’s Jarvis? Same idea. Except Jarvis is a movie, and this one lives on your computer and can do exactly what this page shows.',
    cta: 'See a demo on your own business',
    ctaNote: 'A live call, 30 minutes. Nothing to install.',
    proof: 'Conceived in April 2026. Since July, working every day for its first paying client.',
  },

  before: {
    eyebrow: 'Your typical day',
    title: 'The whole business runs on your memory',
    beats: [
      'People message you in five different chats, and every one of them is waiting on you personally.',
      'Nobody sends the day’s numbers until you ask for them yourself.',
      'Half the agreements live only in your head. Go away for a week and everything stops.',
    ],
    chaosMessages: [
      { from: 'Accountant', text: 'I’ll send it tonight, no time today' },
      { from: 'Manager', text: 'What did we agree with the supplier?' },
      { from: 'Client', text: 'Hello, any answer on my order?' },
      { from: 'Foreman', text: 'Where do I send the site photos?' },
      { from: 'Partner', text: 'We discussed this back in March' },
      { from: 'Sales rep', text: 'Remind me — what did we decide on pricing?' },
    ],
  },

  day: {
    eyebrow: 'The same day',
    title: 'This time you’re the owner, not the dispatcher',
    intro: 'Scroll. The hours pass — it’s working.',
    scenes: [
      {
        time: '09:00',
        title: 'The brief is already waiting',
        text: 'While you slept, it went through the mail and the chats. What happened and what stalled, who’s waiting and on what — one page instead of twenty notifications. By 9:00 it’s in your Telegram, before your first call.',
        fragment: {
          kind: 'briefing',
          tag: 'unprompted',
          label: 'Briefing',
          title: 'Morning briefing',
          lines: [
            'Supplier confirmed Thursday’s delivery',
            '2 new leads overnight — both in the pipeline',
            'Invoice #214 doesn’t match the contract — see clause 3',
          ],
        },
      },
      {
        time: '10:00',
        title: 'You didn’t chase a single report',
        text: 'It wrote to each person itself, in that person’s own messenger, and collected the answers. Where there was silence, it nudged again. You got the whole picture: what’s done and who’s dragging.',
        fragment: {
          kind: 'messenger',
          out: 'Morning — where are we on the Chilanzar site today?',
          in1: 'Suvoq 80%, ertaga yopamiz',
          in2: 'Electrical is stalled — no cable',
          note: 'Timur hasn’t replied — I’ll nudge him at 12:00',
        },
      },
      {
        time: '14:00',
        title: 'The lead didn’t go cold',
        text: 'Someone wrote on Telegram while you were busy. Echelon filed them into the lead list and drafted a reply in your words. If the client goes quiet for two days, it writes to them itself.',
        fragment: {
          kind: 'lead',
          name: 'Dilshod',
          source: 'Telegram · 13:52',
          stage: 'First contact',
          draft: 'Hello. Yes, we do custom orders. Tell me the volume and I’ll have numbers for you by evening.',
          draftLabel: 'A reply in your words — just hit “send”',
        },
      },
      {
        time: '19:00',
        title: 'The day’s numbers add up',
        text: 'The accountant has one set of numbers, the register another. It went around to everyone and collected the data, then asked again for whatever was missing. You got one finished report, not ten messages.',
        fragment: {
          kind: 'report',
          title: 'Numbers for the day',
          rows: [
            { label: 'Register, dine-in', value: '4 120 000' },
            { label: 'Delivery', value: '1 890 000' },
            { label: 'Cashless', value: '2 240 000' },
          ],
          note: 'Zarina hasn’t sent the card-terminal totals — asked again, will add by 20:00',
        },
      },
      {
        time: '23:00',
        title: 'Night shift',
        text: 'The big task you never get around to. It cut the job into pieces and ran several copies of itself in parallel. By morning the result is ready, along with the exact figure for what it cost.',
        fragment: {
          kind: 'night',
          task: 'Go through two years of client records',
          workers: ['Segmentation — running', 'Duplicates — running', 'Report — queued'],
          cost: 'spent: $1.14',
        },
      },
    ],
  },

  touch: {
    eyebrow: 'This exists',
    title: 'The interface below is real',
    intro: 'Not screenshots and not a video: this is live Echelon Desktop, the way you’ll see it on the demo. Click around.',
    demoNote: 'Demo data',
    tabs: {
      chat: 'Chat',
      graph: 'Memory',
      vault: 'Vault',
      kanban: 'Tasks',
      automations: 'Automations',
      analytics: 'Spend',
    },
    hint: 'Walk through the sections on the left — everything works.',
  },

  words: {
    eyebrow: 'The point',
    title: 'Say it once and it becomes the rule',
    lead: 'No settings, no workflow builders. You say it the way you’d say it to a person:',
    instruction:
      'Every Monday at 10 in the morning, ask the foremen how much got done on each site and send me a table.',
    result: 'That’s it. It now happens every Monday.',
    correction: '“Send it by eight and add photos from the site” — from next Monday, that’s how it works.',
    explain:
      'Ordinary software can do what its developer put into it. Here you decide what it can do, in ordinary words. A shawarma stand and a construction firm end up with two different assistants, and nobody designed either of them in advance.',
    switcherLabel: 'See it for your kind of business:',
    businesses: [
      {
        id: 'restaurant',
        name: 'Restaurant',
        cases: [
          'Every evening, pull the day’s revenue from the register and the delivery apps, and set it against last week.',
          'Watch the reviews on the map apps. Draft me replies to the bad ones, thank the good ones yourself.',
          'Every morning, check the stock and remind the buyer what’s running low.',
        ],
      },
      {
        id: 'retail',
        name: 'Retail chain',
        cases: [
          'By nine each morning, yesterday’s revenue for every store, in one table.',
          'Once a week, collect shift timesheets from the managers and check them against the register.',
          'When a new store opens, run the launch checklist and chase whoever’s behind on deadlines.',
        ],
      },
      {
        id: 'construction',
        name: 'Construction firm',
        cases: [
          'Every Monday, collect progress on each site from the foremen, with photos.',
          'Track the delivery deadlines. If a supplier slips, remind him and tell me.',
          'When a contractor invoice comes in, check it against the contract and show me what doesn’t match.',
        ],
      },
      {
        id: 'clinic',
        name: 'Clinic',
        cases: [
          'Remind patients about their appointment a day ahead, and offer to move it if they don’t confirm.',
          'Every evening: visits, cancellations, no-shows, new inquiries.',
          'Log requests from the website and messengers into the database and draft the first reply.',
        ],
      },
    ],
  },

  pillars: {
    eyebrow: 'What this stands on',
    title: 'It’s built like an assistant, not like a program',
    items: [
      {
        name: 'Remembers',
        text: 'Who promised what, and what the two of you agreed back in March. That memory doesn’t wipe when a window closes and doesn’t reset in a new chat.',
      },
      {
        name: 'Does the work',
        text: 'It doesn’t advise, it does: writes to people, pulls the numbers, nudges the silent, files leads into the CRM. What’s left for you is checking, not doing.',
      },
      {
        name: 'Learns',
        text: 'Say “write shorter to clients” once, and it becomes a permanent rule. A month in, it works the way things are done at your place.',
      },
      {
        name: 'Works nights',
        text: 'By 9:00 the brief is already in your Telegram. At night it does what your day never has room for. It keeps the schedule on its own; nobody reminds it.',
      },
      {
        name: 'Yours',
        text: 'It lives on your computer. The correspondence, the memory, the numbers, the client list — all of it stays with you, not in someone else’s cloud. It can’t quit and take them along.',
      },
    ],
  },

  voice: {
    eyebrow: 'Just talk',
    title: 'This is where Jarvis stops being a figure of speech',
    text: 'You’re driving, turning the new location over in your head — so you talk it through out loud, the way you would with a person. It answers in voice, and it remembers your whole business, down to how the March negotiations ended. Say “handle it” at the end, and it goes off and does.',
    sphereHint: 'The sphere below is live. Press it and ask it about Echelon, out loud.',
    talkButton: 'Talk',
    stopButton: 'End',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking',
    connecting: 'Connecting…',
    unavailable: 'Hear how it talks:',
    playRecording: 'Play recording',
    micDenied: 'Microphone access needed',
    error: 'Couldn’t connect. Try again later.',
  },

  honesty: {
    eyebrow: 'No fairy tales',
    title: 'It prepares decisions. You make them',
    paragraphs: [
      'It doesn’t sign contracts, doesn’t move money, doesn’t hire, doesn’t fire — even if you ask. The routine it carries to the end itself; the decision it brings you prepared.',
      'It’s set up for one person — the owner. That’s a position, not a shortcoming: an assistant has one boss.',
      'It isn’t magic. Everything on this page is what it does every day, and beyond that we promise nothing.',
    ],
    setup:
      'Echelon Desktop installs on a regular computer running Windows, macOS, or Linux, and is configured for you personally — your people, your way of doing things. It lives on the computer; you can write to it from anywhere, including Telegram on your phone.',
  },

  math: {
    eyebrow: 'Do the math in people',
    title: 'The right comparison isn’t software — it’s a person on staff',
    rows: [
      { label: 'A salary, every month', human: 'yes', echelon: 'no' },
      { label: 'Gets sick and goes on vacation', human: 'yes', echelon: 'no' },
      { label: 'Quits — and takes everything they remember with them', human: 'yes', echelon: 'no' },
      { label: 'Remembers every agreement word for word', human: 'no', echelon: 'yes' },
      { label: 'Works nights and weekends', human: 'no', echelon: 'yes' },
    ],
    humanCol: 'An assistant on staff',
    echelonCol: 'Echelon Desktop',
    bottom: 'The exact figure comes on the demo. It’s less than the salary of one more hire — noticeably.',
  },

  finalCta: {
    title: 'Watch it pull together a report on your business',
    text: 'Message on Telegram and we’ll set a time for a live demo. Half an hour, nothing to install: you watch it work on examples from your own business.',
    button: 'Message on Telegram',
    note: '@komrxn · Telegram',
  },

  footer: {
    product: 'Echelon Desktop',
    line: 'A personal assistant for the business owner. Lives on your computer.',
    demoNote: 'The examples on this page use demo data.',
    rights: '© 2026 Echelon Desktop',
  },

  ui: {
    appTitle: 'Echelon Desktop',
    nav: {
      daily: 'Daily',
      chat: 'Chat',
      home: 'Home',
      memory: 'Memory',
      graph: 'Graph',
      vault: 'Vault',
      sessions: 'Sessions',
      operate: 'Operate',
      kanban: 'Smart Kanban',
      automations: 'Automations',
      skills: 'Skills',
      computer: 'Computer',
      channels: 'Channels',
      connections: 'Connections',
      brain: 'Brain',
      models: 'Models',
      analytics: 'Analytics',
    },
    chat: {
      composer: 'Message Echelon Desktop…',
      briefingTag: 'unprompted',
      briefingKind: 'Briefing',
      briefingTitle: 'Morning briefing — 3 items',
      briefingBody: 'Supplier confirmed the delivery · 2 new leads overnight · invoice #214 needs your decision',
      briefingTime: '09:00',
      discuss: 'Discuss',
      userMsg: 'Collect progress on each site from the foremen and send me a table.',
      working: 'Working…',
      toolsDone: 'Tools: 4',
      reply: 'Done. Messaged three on Telegram, Rustam on WhatsApp. Two replied right away; nothing from Timur — I’ll nudge him at 12:00. Table by 13:00.',
      replyMeta: '10:41 · $0.04',
      chips: [
        {
          q: 'What about the Telegram lead?',
          a: 'The lead from Dilshod is in the pipeline, stage “first contact”. A reply is drafted in your words — send it?',
        },
        {
          q: 'How much have we spent today?',
          a: 'My work today cost $0.62: the briefing, 14 messages, the site report. Daily cap is $5, 12% used.',
        },
        {
          q: 'Remind me what we agreed with Alisher',
          a: 'In March: 14-day payment deferral, delivery at his cost on orders from 50 blocks. Recorded from the March 12 correspondence.',
        },
      ],
    },
    kanban: {
      columns: ['Running', 'Blocked', 'Review', 'Done'],
      cards: {
        running: ['Collect packaging prices from three suppliers', 'Replies to the week’s reviews'],
        blocked: ['Contractor invoice reconciliation — waiting on a document'],
        review: ['Channel post: the new menu'],
        done: ['Yesterday’s revenue report'],
      },
    },
    automations: {
      title: 'Automations',
      rows: [
        { name: 'Morning briefing', schedule: 'every day, 09:00', active: true },
        { name: 'Evening numbers by location', schedule: 'every day, 19:00', active: true },
        { name: 'Foremen reports', schedule: 'Monday, 10:00', active: true },
        { name: 'Stalled tasks — follow up', schedule: 'every day, 10:00', active: true },
      ],
      active: 'running',
      paused: 'paused',
    },
    graph: {
      stats: 'nodes: {n} · links: {e}',
      legend: {
        owner: 'You',
        people: 'People',
        projects: 'Projects',
        memories: 'Agreements',
        themes: 'Topics',
      },
      hint: 'Wheel to zoom · drag the canvas · click a node',
      card: {
        links: 'links',
        types: {
          owner: 'You',
          job: 'Business',
          person: 'Person',
          project: 'Project',
          memory: 'Agreement',
          theme: 'Topic',
          thought: 'Note',
        },
      },
      data: {
        job: 'Your business',
        people: [
          'Alisher · supplier', 'Dilshod · client', 'Timur · foreman', 'Rustam · foreman',
          'Zarina · accountant', 'Otabek · manager', 'Jasur · site chief', 'Nodira · sales',
          'Sanjar · supplier', 'Bekzod · driver', 'Umid · client', 'Gulnora · cashier',
          'Farrukh · partner', 'Aziz · purchasing', 'Shakhnoza · sales', 'Komil · client',
          'Madina · accountant', 'Ikrom · contractor', 'Sevara · admin', 'Bakhodir · supplier',
          'Lola · client', 'Sherzod · foreman', 'Diyora · sales', 'Ulugbek · partner',
        ],
        projects: [
          'Chilanzar site', 'Yunusabad site', 'New location', 'Cable delivery',
          'Warehouse repair', 'Finishing tender', 'Packaging purchase', 'Company website',
          'Office move', 'Lease contract', 'Certification', 'Shift hiring',
        ],
        themes: ['Supplies', 'Pricing', 'Staff', 'Clients', 'Warehouse', 'Reports', 'Rent', 'Ads'],
        memoryTemplates: [
          '14-day deferral — {p}',
          'Discount from 50 blocks — {p}',
          'Payment on delivery — {p}',
          'Delivery at his cost — {p}',
          'Site photos every Monday — {p}',
          'No calls after 20:00 — {p}',
          '30% prepayment — {p}',
          'Check invoices against the contract — {p}',
          'Report by 19:00 — {p}',
          'Write in Uzbek — {p}',
        ],
        thoughtTemplates: [
          'Check prices on {t}',
          'Discuss {t} at the standup',
          'Risk around {t}',
          'Idea: automate {t}',
        ],
      },
    },
    vault: {
      searchNote: 'Click a row to open the note',
      filters: { all: 'All', person: 'People', project: 'Projects', memory: 'Agreements', theme: 'Topics' },
      cols: { label: 'Name', type: 'Type', summary: 'Summary', updated: 'Updated' },
      rows: [
        { label: 'alisher', type: 'person', summary: 'Block supplier · 14-day deferral, delivery on him', updated: '2 h ago' },
        { label: 'dilshod', type: 'person', summary: 'Client · custom order, waiting for numbers tonight', updated: 'today' },
        { label: 'zarina', type: 'person', summary: 'Accountant · sends card totals by 20:00', updated: 'yesterday' },
        { label: 'chilanzar site', type: 'project', summary: 'Plastering 80% · electrical waiting on cable', updated: '3 h ago' },
        { label: 'new location', type: 'project', summary: 'Launch checklist · 12 of 18 items closed', updated: 'yesterday' },
        { label: 'alisher deferral', type: 'memory', summary: '14 days since March 12 · recorded from the chat', updated: 'March' },
        { label: 'reporting rule', type: 'memory', summary: 'Foremen — Monday 10:00, with photos', updated: 'July' },
        { label: 'client tone', type: 'memory', summary: 'Short, no legalese, always polite', updated: 'June' },
        { label: 'supplies', type: 'theme', summary: '3 suppliers · schedule and prices for each', updated: 'today' },
        { label: 'staff', type: 'theme', summary: 'Shifts, timesheets, two open roles', updated: 'yesterday' },
      ],
    },
    analytics: {
      kpis: [
        { label: 'Today', value: '$0.62' },
        { label: 'This week', value: '$4.18' },
        { label: 'Replies today', value: '27' },
      ],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [0.54, 0.71, 0.48, 0.66, 0.62, 0.31, 0.24],
      note: 'Cost from actual billing, not estimates. Daily cap $5.',
    },
  },
};
