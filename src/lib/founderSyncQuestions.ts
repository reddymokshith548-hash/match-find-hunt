// Founder Sync Test - 30 Questions MCQ Assessment
// Based on empirically validated startup success models:
// - Complementary Founder Pairs (Jobs/Wozniak, Chesky/Blecharczyk)
// - Overlapping Peer Pairs (Page/Brin, Collison Brothers)

export interface Question {
  id: number;
  category: 'A' | 'B' | 'C'; // A: Role & Skill DNA, B: Decision-Making, C: Values & Personality
  text: string;
  options: { value: 'A' | 'B' | 'C' | 'D'; label: string }[];
  weight: 'complementary' | 'overlapping' | 'both'; // Which matching model this question primarily affects
}

export interface FounderSyncAnswers {
  [key: string]: string; // q1, q2, ... q30
}

export interface OtherTexts {
  [key: number]: string; // For "Other" option free-text
}

// Category A: Core Role & Skill DNA (Questions 1-10)
// These questions are weighted HIGH for Complementary Matching Logic
const CATEGORY_A_QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'A',
    weight: 'complementary',
    text: "What is your primary contribution to a startup?",
    options: [
      { value: 'A', label: 'Building the product - coding, engineering, or designing the core offering' },
      { value: 'B', label: 'Shaping the vision - defining strategy, storytelling, and market positioning' },
      { value: 'C', label: 'Running operations - sales, marketing, finance, or business development' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 2,
    category: 'A',
    weight: 'complementary',
    text: "If a working prototype needs to be shipped tomorrow, who handles it?",
    options: [
      { value: 'A', label: 'I am hands-on and can build it myself' },
      { value: 'B', label: 'I will guide and oversee, but I need someone technical to execute' },
      { value: 'C', label: 'I focus on what happens after the product is ready - launch, users, growth' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 3,
    category: 'A',
    weight: 'complementary',
    text: "When picking a co-founder, do you prefer someone with similar skills or different expertise?",
    options: [
      { value: 'A', label: 'Different - I want complementary skills that cover my weaknesses' },
      { value: 'B', label: 'Similar - I want a peer who can deeply collaborate on shared work' },
      { value: 'C', label: 'A blend - some overlap but also unique strengths' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 4,
    category: 'A',
    weight: 'complementary',
    text: "What type of company culture do you naturally create?",
    options: [
      { value: 'A', label: 'Engineering-driven - ship fast, iterate often, minimal bureaucracy' },
      { value: 'B', label: 'Vision-driven - mission-first, inspiring, purpose-oriented' },
      { value: 'C', label: 'Results-driven - metrics, growth targets, accountability' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 5,
    category: 'A',
    weight: 'complementary',
    text: "How do you approach scaling a team?",
    options: [
      { value: 'A', label: 'Hire specialists to take over functions I lead now' },
      { value: 'B', label: 'Bring on generalists who can wear many hats early on' },
      { value: 'C', label: 'Hire a strong second-in-command to manage operations so I can focus on growth' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 6,
    category: 'A',
    weight: 'complementary',
    text: "When the company needs to pivot, what role do you play?",
    options: [
      { value: 'A', label: 'I analyze data and identify what is not working technically' },
      { value: 'B', label: 'I redefine the vision and communicate the new direction' },
      { value: 'C', label: 'I restructure operations and realign the team to new goals' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 7,
    category: 'A',
    weight: 'complementary',
    text: "What energizes you most at work?",
    options: [
      { value: 'A', label: 'Solving complex technical or design problems' },
      { value: 'B', label: 'Pitching ideas, storytelling, or inspiring others' },
      { value: 'C', label: 'Closing deals, hitting milestones, or seeing growth metrics' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 8,
    category: 'A',
    weight: 'complementary',
    text: "How do you define success in a co-founder relationship?",
    options: [
      { value: 'A', label: 'Clear division of labor - everyone owns their domain' },
      { value: 'B', label: 'Seamless collaboration - we work on everything together' },
      { value: 'C', label: 'Mutual trust - we respect each other\'s judgment even in our separate areas' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 9,
    category: 'A',
    weight: 'complementary',
    text: "What best describes your approach to fundraising?",
    options: [
      { value: 'A', label: 'I focus on building and let someone else handle investor relations' },
      { value: 'B', label: 'I lead the pitch - storytelling and vision are my strengths' },
      { value: 'C', label: 'I manage due diligence, financials, and operational metrics' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 10,
    category: 'A',
    weight: 'complementary',
    text: "When hiring, what do you prioritize?",
    options: [
      { value: 'A', label: 'Technical skills and ability to execute immediately' },
      { value: 'B', label: 'Cultural fit and alignment with the mission' },
      { value: 'C', label: 'Proven track record and measurable achievements' },
      { value: 'D', label: 'Other' },
    ],
  },
];

// Category B: Decision-Making & Conflict Style (Questions 11-20)
// These questions affect both models, especially founder survivability
const CATEGORY_B_QUESTIONS: Question[] = [
  {
    id: 11,
    category: 'B',
    weight: 'both',
    text: "When you and your co-founder strongly disagree, how do you resolve it?",
    options: [
      { value: 'A', label: 'Whoever owns the domain makes the final call' },
      { value: 'B', label: 'We debate until we reach consensus' },
      { value: 'C', label: 'We test both ideas small-scale and let data decide' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 12,
    category: 'B',
    weight: 'both',
    text: "How do you handle a situation where your co-founder made a decision you think was wrong?",
    options: [
      { value: 'A', label: 'I trust their judgment - course-correct later if needed' },
      { value: 'B', label: 'I immediately raise my concerns and push for reconsideration' },
      { value: 'C', label: 'I note it but wait to see the results before commenting' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 13,
    category: 'B',
    weight: 'both',
    text: "How much control do you need over key decisions?",
    options: [
      { value: 'A', label: 'High - I need final say on my areas of responsibility' },
      { value: 'B', label: 'Moderate - I prefer to be consulted but can delegate' },
      { value: 'C', label: 'Low - I trust my co-founder\'s judgment on most things' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 14,
    category: 'B',
    weight: 'both',
    text: "When the stakes are high, I prefer to...",
    options: [
      { value: 'A', label: 'Take calculated risks backed by data and research' },
      { value: 'B', label: 'Move fast and accept the possibility of failure' },
      { value: 'C', label: 'Wait for more information before committing' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 15,
    category: 'B',
    weight: 'both',
    text: "How do you respond when your startup faces a crisis?",
    options: [
      { value: 'A', label: 'I take charge and make decisive calls' },
      { value: 'B', label: 'I gather the team and we problem-solve together' },
      { value: 'C', label: 'I focus on damage control while analyzing root causes' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 16,
    category: 'B',
    weight: 'both',
    text: "How do you communicate under stress?",
    options: [
      { value: 'A', label: 'I become more direct and action-focused' },
      { value: 'B', label: 'I try to stay calm and measured in my communication' },
      { value: 'C', label: 'I withdraw temporarily to think before responding' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 17,
    category: 'B',
    weight: 'both',
    text: "How do you feel about taking on debt or risky funding terms?",
    options: [
      { value: 'A', label: 'I avoid it unless absolutely necessary' },
      { value: 'B', label: 'I am open to it if it accelerates growth' },
      { value: 'C', label: 'I weigh it carefully and only proceed with a clear payback plan' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 18,
    category: 'B',
    weight: 'both',
    text: "When your co-founder needs to make a quick call without consulting you, you...",
    options: [
      { value: 'A', label: 'Expect them to follow established principles we have agreed on' },
      { value: 'B', label: 'Trust them fully - they know the right thing to do' },
      { value: 'C', label: 'Prefer a quick message before major decisions' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 19,
    category: 'B',
    weight: 'both',
    text: "How do you approach goal-setting with a co-founder?",
    options: [
      { value: 'A', label: 'We set shared OKRs and track progress together' },
      { value: 'B', label: 'We define big-picture goals but stay flexible on tactics' },
      { value: 'C', label: 'We divide goals by function - each owns their outcomes' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 20,
    category: 'B',
    weight: 'both',
    text: "What is your ideal level of day-to-day communication with a co-founder?",
    options: [
      { value: 'A', label: 'Constant - we sync multiple times per day' },
      { value: 'B', label: 'Regular - daily standups or weekly check-ins' },
      { value: 'C', label: 'As-needed - we trust each other to reach out when necessary' },
      { value: 'D', label: 'Other' },
    ],
  },
];

// Category C: Values & Personality (Questions 21-30)
// These questions are weighted HIGH for Overlapping / Peer Matching Logic
const CATEGORY_C_QUESTIONS: Question[] = [
  {
    id: 21,
    category: 'C',
    weight: 'overlapping',
    text: "What matters most to you in a business partnership?",
    options: [
      { value: 'A', label: 'Integrity - I need someone whose ethics match mine' },
      { value: 'B', label: 'Ambition - I need someone who dreams as big as I do' },
      { value: 'C', label: 'Pragmatism - I need someone grounded in reality' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 22,
    category: 'C',
    weight: 'overlapping',
    text: "How do you feel about public recognition or media attention?",
    options: [
      { value: 'A', label: 'I enjoy it - being a face of the company feels natural' },
      { value: 'B', label: 'I tolerate it - I will do it if it helps the business' },
      { value: 'C', label: 'I prefer to stay behind the scenes' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 23,
    category: 'C',
    weight: 'overlapping',
    text: "How important is transparency in your co-founder relationship?",
    options: [
      { value: 'A', label: 'Critical - full visibility on all decisions, finances, and concerns' },
      { value: 'B', label: 'Important - we share openly but respect each other\'s space' },
      { value: 'C', label: 'Moderate - we communicate what is relevant to shared work' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 24,
    category: 'C',
    weight: 'overlapping',
    text: "What is your philosophy on equity splits?",
    options: [
      { value: 'A', label: '50/50 - equal partners, equal ownership' },
      { value: 'B', label: 'Based on contribution - skill, time, or capital invested' },
      { value: 'C', label: 'Based on role - the CEO or lead founder should have more' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 25,
    category: 'C',
    weight: 'overlapping',
    text: "How do you think about work-life balance as a founder?",
    options: [
      { value: 'A', label: 'Startup life requires full commitment - I am all-in' },
      { value: 'B', label: 'I work hard but protect time for personal life' },
      { value: 'C', label: 'Balance is essential - sustainability matters for the long term' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 26,
    category: 'C',
    weight: 'overlapping',
    text: "What motivates you to build a company?",
    options: [
      { value: 'A', label: 'Financial success - I want to build wealth' },
      { value: 'B', label: 'Impact - I want to solve a meaningful problem' },
      { value: 'C', label: 'Freedom - I want to create my own path and build something mine' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 27,
    category: 'C',
    weight: 'overlapping',
    text: "How do you handle ego in a partnership?",
    options: [
      { value: 'A', label: 'I actively work to check my ego - team over individual' },
      { value: 'B', label: 'I am confident but open to feedback' },
      { value: 'C', label: 'I expect my expertise to be respected in my domain' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 28,
    category: 'C',
    weight: 'overlapping',
    text: "What is your approach to product development?",
    options: [
      { value: 'A', label: 'User-first - obsess over the customer experience' },
      { value: 'B', label: 'Innovation-first - push boundaries even if users do not ask for it' },
      { value: 'C', label: 'Market-first - build what sells' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 29,
    category: 'C',
    weight: 'overlapping',
    text: "How do you feel about competition?",
    options: [
      { value: 'A', label: 'I thrive on it - competition motivates me' },
      { value: 'B', label: 'I focus on my own path - ignore competitors' },
      { value: 'C', label: 'I study competitors but differentiate rather than compete head-on' },
      { value: 'D', label: 'Other' },
    ],
  },
  {
    id: 30,
    category: 'C',
    weight: 'overlapping',
    text: "What is your long-term vision for your role in the company?",
    options: [
      { value: 'A', label: 'I want to stay CEO/lead and grow with the company indefinitely' },
      { value: 'B', label: 'I am open to stepping back if the company needs different leadership' },
      { value: 'C', label: 'I see myself building, selling, and moving on to the next thing' },
      { value: 'D', label: 'Other' },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = [
  ...CATEGORY_A_QUESTIONS,
  ...CATEGORY_B_QUESTIONS,
  ...CATEGORY_C_QUESTIONS,
];

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

// Derive founder archetype from Category A answers
export function deriveFounderArchetype(answers: FounderSyncAnswers): string {
  const categoryAAnswers = Object.entries(answers)
    .filter(([key]) => {
      const qNum = parseInt(key.replace('q', ''));
      return qNum >= 1 && qNum <= 10;
    })
    .map(([, value]) => value);

  const counts = { A: 0, B: 0, C: 0 };
  categoryAAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });

  // A = Builder/Engineer, B = Visionary, C = Operator/Business
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Builder';
  if (counts.B === max) return 'Visionary';
  return 'Operator';
}

// Derive decision-making style from Category B answers
export function deriveDecisionStyle(answers: FounderSyncAnswers): string {
  const categoryBAnswers = Object.entries(answers)
    .filter(([key]) => {
      const qNum = parseInt(key.replace('q', ''));
      return qNum >= 11 && qNum <= 20;
    })
    .map(([, value]) => value);

  const counts = { A: 0, B: 0, C: 0 };
  categoryBAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });

  // A = Decisive/Structured, B = Collaborative, C = Analytical
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Decisive';
  if (counts.B === max) return 'Collaborative';
  return 'Analytical';
}

// Derive values alignment from Category C answers
export function deriveValuesProfile(answers: FounderSyncAnswers): string {
  const categoryCAnswers = Object.entries(answers)
    .filter(([key]) => {
      const qNum = parseInt(key.replace('q', ''));
      return qNum >= 21 && qNum <= 30;
    })
    .map(([, value]) => value);

  const counts = { A: 0, B: 0, C: 0 };
  categoryCAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });

  // A = Integrity-driven, B = Ambition-driven, C = Freedom-driven
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Integrity-Focused';
  if (counts.B === max) return 'Mission-Driven';
  return 'Pragmatic';
}

// Derive risk tolerance from specific questions
export function deriveRiskTolerance(answers: FounderSyncAnswers): string {
  const riskQuestions = [14, 17, 25]; // Stakes, debt, work-life
  const riskAnswers = riskQuestions.map(q => answers[`q${q}`]).filter(Boolean);
  
  const counts = { A: 0, B: 0, C: 0 };
  riskAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });

  if (counts.C >= counts.A && counts.C >= counts.B) return 'Conservative';
  if (counts.B >= counts.A) return 'Adaptive';
  return 'Calculated';
}

// Derive leadership style from specific questions
export function deriveLeadershipStyle(answers: FounderSyncAnswers): string {
  const leadershipQuestions = [11, 13, 15, 19]; // Conflict, control, crisis, goals
  const leadershipAnswers = leadershipQuestions.map(q => answers[`q${q}`]).filter(Boolean);
  
  const counts = { A: 0, B: 0, C: 0 };
  leadershipAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });

  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Directive';
  if (counts.B === max) return 'Collaborative';
  return 'Delegative';
}

// Get category label
export function getCategoryLabel(category: 'A' | 'B' | 'C'): string {
  switch (category) {
    case 'A': return 'Core Role & Skill DNA';
    case 'B': return 'Decision-Making & Conflict Style';
    case 'C': return 'Values & Personality';
  }
}

// Get category color
export function getCategoryColor(category: 'A' | 'B' | 'C'): string {
  switch (category) {
    case 'A': return 'text-blue-500';
    case 'B': return 'text-amber-500';
    case 'C': return 'text-purple-500';
  }
}
