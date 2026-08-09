import type { Dict } from './ru';

export const en: Dict = {
  meta: {
    title: 'Echelon Desktop — the assistant that remembers your whole business',
    description:
      'A personal assistant for the business owner. Lives on your computer, remembers people and agreements, collects reports, answers clients, and works through the night. See a demo on your own business.',
  },

  nav: {
    cta: 'See a demo',
  },

  hero: {
    h1: 'Remembers your whole business.\nDoes the work itself.\nNever sleeps.',
    sub: 'Echelon Desktop is a personal assistant for the business owner. Remember Tony Stark’s Jarvis? Same idea. Except Jarvis is a movie, and this one runs on your computer and does exactly what you see below. It doesn’t sleep, doesn’t forget, and doesn’t quit.',
    cta: 'See a demo on your business',
    ctaNote: 'A live call, 30 minutes. Nothing to install.',
    proof: 'The product is a year old. It runs the author’s business every day — and is already in production for its first paying client.',
  },

  before: {
    eyebrow: 'Your typical day',
    title: 'Sound familiar?',
    beats: [
      'People message you in five different chats — and every one of them expects a reply.',
      'The day’s numbers get collected only if you chase them yourself.',
      'Half the agreements live in your head. Nothing moves without you.',
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
    title: 'One day with Echelon Desktop',
    intro: 'Scroll. The hours pass — it keeps working.',
    scenes: [
      {
        time: '09:00',
        title: 'The briefing is already in',
        text: 'While you slept, it went through your mail and chats. What happened, what stalled, who is waiting on you — one page instead of twenty notifications. It’s already waiting in your Telegram.',
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
        title: 'Reports collected without you',
        text: 'It messaged every person itself — in whatever messenger they use. Collected the answers. Where someone went quiet, it followed up. You get the whole picture: done, not done, who’s dragging.',
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
        text: 'Someone wrote on Telegram while you were busy. They’re already in the pipeline, and a reply is drafted in your words. If they go quiet for two days, Echelon writes to them itself.',
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
        title: 'The day’s numbers, reconciled',
        text: 'The accountant has one set of numbers, the manager another, the register a third. It went around to everyone, pulled the data, and asked again for whatever was missing. You get one finished report, not ten messages.',
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
        text: 'The big task you never have a free day for: it split the work into parts and ran several copies of itself in parallel. By morning — the result, and the exact amount it cost.',
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
    title: 'See for yourself',
    intro: 'These aren’t screenshots or a video. Below is the live Echelon Desktop interface, exactly as you’ll see it on the demo. Click around.',
    demoNote: 'Demo data',
    tabs: {
      chat: 'Chat',
      graph: 'Memory',
      kanban: 'Tasks',
      automations: 'Automations',
    },
  },

  words: {
    eyebrow: 'The point',
    title: 'Say it in plain words — it becomes a habit',
    lead: 'No settings, no workflow builders. You say it the way you’d say it to a person:',
    instruction:
      'Every Monday at 10 am, collect progress on each site from the foremen and send me a table.',
    result: 'That’s it. It now runs every week.',
    correction: '“Send it at eight, and add photos from the site” — and starting next Monday, that’s how it goes.',
    explain:
      'Ordinary software does what its developer thought to build in. Here you decide what it can do — in your own words. A shawarma stand and a construction firm end up with completely different assistants, and nobody designed either one in advance.',
    switcherLabel: 'See it for your kind of business:',
    businesses: [
      {
        id: 'restaurant',
        name: 'Restaurant',
        cases: [
          'Every evening, pull the day’s revenue from the register, dine-in, and delivery — and compare it to last week.',
          'Watch the reviews on the map services. Draft me a reply to the bad ones, thank the good ones yourself.',
          'Every morning, check the stock and remind the purchasing manager what’s running low.',
        ],
      },
      {
        id: 'retail',
        name: 'Retail chain',
        cases: [
          'By nine each morning — yesterday’s revenue for every location, in one table.',
          'Once a week, collect shift timesheets from the managers and check them against the register.',
          'When a new location opens, run the launch checklist and chase the people responsible on deadlines.',
        ],
      },
      {
        id: 'construction',
        name: 'Construction firm',
        cases: [
          'Every Monday, collect progress on each site from the foremen, with photos.',
          'Track delivery deadlines. If a supplier slips, remind them and tell me.',
          'When a contractor invoice comes in, check it against the contract and show me the discrepancies.',
        ],
      },
      {
        id: 'clinic',
        name: 'Clinic',
        cases: [
          'Remind patients about appointments a day ahead — and offer to reschedule if they don’t confirm.',
          'Every evening — how many visits, how many cancellations, how many new inquiries.',
          'Log requests from the website and messengers into the database and draft the first reply.',
        ],
      },
    ],
  },

  pillars: {
    eyebrow: 'What this stands on',
    title: 'Five reasons this works',
    items: [
      {
        name: 'Remembers',
        text: 'Who’s who, who promised what, what was agreed in March. Memory doesn’t vanish when a window closes and doesn’t reset in a new chat — and it belongs to you.',
      },
      {
        name: 'Does the work',
        text: 'It doesn’t give advice, it does the work: messages people, gathers data, sends reports, files leads into the CRM. What’s left for you is to check — not to do it yourself.',
      },
      {
        name: 'Learns',
        text: 'Correct it once — “write shorter replies to clients” — and that’s a permanent working rule. A month in, it runs things the way you want them run.',
      },
      {
        name: 'Never sleeps',
        text: 'By 9:00 the briefing is already in. At night it handles what your day never has room for. It keeps the schedule itself — no reminding.',
      },
      {
        name: 'Yours',
        text: 'It lives on your computer. The memory, the messages, and the numbers stay with you, not in someone else’s cloud. It can’t quit and take them along.',
      },
    ],
  },

  voice: {
    eyebrow: 'Just talk',
    title: 'This is where Jarvis stops being a metaphor',
    text: 'You’re driving, thinking about the new location — so you talk it through out loud, like you would with a person. It answers in voice, remembers your whole business, and knows how the March negotiations ended. And at the end you can say “handle it” — and it goes and does.',
    sphereHint: 'The sphere below is live. Press it and ask about Echelon — out loud.',
    talkButton: 'Talk',
    stopButton: 'End',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking',
    connecting: 'Connecting…',
    unavailable: 'Hear how it sounds:',
    playRecording: 'Play recording',
    micDenied: 'Microphone access needed',
    error: 'Couldn’t connect. Try again later.',
  },

  honesty: {
    eyebrow: 'No fairy tales',
    title: 'What it doesn’t do',
    paragraphs: [
      'It doesn’t make decisions for you. It doesn’t sign contracts, doesn’t move money, doesn’t hire or fire. The routine you assign, it does on its own; decisions it prepares — you make them.',
      'It’s set up for one person — the owner. Deliberately so: an assistant answers to one boss.',
      'It isn’t magic. Everything on this page is what it does every day. We promise nothing beyond that.',
    ],
    setup:
      'Echelon Desktop installs on a regular computer — Windows, macOS, or Linux — and is configured for you personally: your business, your people, your rules. It lives on the computer — and you can message it from anywhere, including Telegram on your phone.',
  },

  math: {
    eyebrow: 'Do the math in people',
    title: 'What does an assistant cost?',
    rows: [
      { label: 'A salary, every month', human: 'yes', echelon: 'no' },
      { label: 'Sleeps, gets sick, takes vacation', human: 'yes', echelon: 'no' },
      { label: 'Quits — and takes everything they remembered', human: 'yes', echelon: 'no' },
      { label: 'Remembers every agreement word for word', human: 'no', echelon: 'yes' },
      { label: 'Works nights and weekends', human: 'no', echelon: 'yes' },
    ],
    humanCol: 'Assistant on staff',
    echelonCol: 'Echelon Desktop',
    bottom: 'You’ll get the exact figure on the demo. It’s less than one more hire — noticeably less.',
  },

  finalCta: {
    title: 'Watch it pull together a report on your business',
    text: 'Write on Telegram and we’ll set up a live demo. Half an hour, nothing to install: you just watch it work on examples from your own business.',
    button: 'Message on Telegram',
    note: '@komrxn · the product owner replies',
  },

  footer: {
    product: 'Echelon Desktop',
    line: 'A personal assistant for the business owner. Lives on your computer.',
    demoNote: 'All data in the examples on this page is demo data.',
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
    },
    graph: {
      stats: 'nodes: 299 · links: 632',
      legend: {
        owner: 'You',
        people: 'People',
        projects: 'Projects',
        memories: 'Agreements',
        themes: 'Topics',
      },
    },
  },
};
