export const companies = [
  { name: "Anthropic", logo: "/brand/company-logos/anthropic.svg" },
  { name: "OpenAI", logo: "/brand/company-logos/openai.svg" },
  { name: "Citadel", logo: "/brand/company-logos/citadel.svg" },
  { name: "Jane Street", logo: "/brand/company-logos/jane-street.svg" },
  { name: "Meta", logo: "/brand/company-logos/meta.svg" },
  { name: "Google", logo: "/brand/company-logos/google.svg" },
  { name: "NVIDIA", logo: "/brand/company-logos/nvidia.svg" },
  { name: "Apple", logo: "/brand/company-logos/apple.svg" },
  { name: "D. E. Shaw", logo: "/brand/company-logos/de-shaw.svg" },
  { name: "J.P. Morgan", logo: "/brand/company-logos/jp-morgan.svg" },
  {
    name: "Google DeepMind",
    logo: "/brand/company-logos/google-deepmind.svg",
  },
] as const;

export const specifications = [
  { label: "Name", value: "Anqi Qu" },
  { label: "Country of manufacture", value: "South Africa" },
  { label: "Model", value: "Gemini" },
  { label: "Chromosomes", value: "XX" },
  { label: "Dogs", value: "2" },
  { label: "Battery life", value: "Up to 16 hours" },
  { label: "Time to full recharge", value: "Approximately 8 hours" },
  {
    label: "Dimensions",
    dimensions: [
      { label: "H", value: "166 cm" },
      { label: "W", value: "variable" },
      {
        label: "D",
        value: "Book a demo to find out for yourself ;)",
        href: "/contact",
      },
    ],
  },
] as const;

export const changelog = [
  {
    version: "v23.0",
    year: "2025",
    headline: "Major release: fine-tuning begins at the University of Oxford.",
    notes: [
      {
        label: "Added",
        text: "Reinforcement learning, autonomous agents, strategic game theory, and AI alignment research. Rhodes Scholar build.",
      },
      { label: "Improved", text: "Training efficiency." },
      { label: "Breaking changes", text: "Timezone." },
      { label: "Known regressions", text: "Proximity to dogs." },
    ],
  },
  {
    version: "v19.0",
    year: "2021",
    headline: "Major release: pretraining begins at the University of Chicago.",
    notes: [
      { label: "Added", text: "Economics, Statistics, Computer Science." },
      { label: "Changed", text: "Sleep schedule is now experimental." },
      { label: "Deprecated", text: "Free time." },
      {
        label: "Fixed",
        text: "Several personality bugs. Introduced new ones.",
      },
    ],
  },
  {
    version: "v5.0",
    year: "2007",
    headline: "Major release: enrolled in primary school.",
    notes: [
      { label: "Added", text: "Literacy." },
      { label: "Deprecated", text: "Naps (reverted in v22.0)." },
    ],
  },
  {
    version: "v1.0",
    year: "2002",
    headline: "Initial release. Shipped from South Africa.",
    notes: [
      {
        label: "Added",
        text: "Object permanence, bipedal locomotion (unstable).",
      },
      { label: "Known issues", text: "Cannot yet write emails." },
    ],
  },
] as const;

export const comparisons = [
  { capability: "Can write emails", anqi: "Yes", chatgpt: "Yes", claude: "Yes" },
  {
    capability: "Knows machine learning",
    anqi: "Yes",
    chatgpt: "Yes",
    claude: "Yes",
  },
  {
    capability: "Multimodal support",
    anqi: "Text, image, voice, touch",
    chatgpt: "Text, image, voice",
    claude: "Text, image, voice",
  },
  { capability: "Hallucinations", anqi: "Yes", chatgpt: "Yes", claude: "Yes" },
] as const;

export const benchmarks = {
  suite: "AnqBench",
  axes: [
    { key: "soup", label: "SoupEval-2", full: "Soup evaluation" },
    { key: "bugs", label: "Bug-STOMP", full: "Catching bugs" },
    { key: "image", label: "ImageNet-R", full: "Image classification" },
    { key: "verbal", label: "VerbalIQ", full: "Verbal reasoning" },
    { key: "hydration", label: "H2O-Bench", full: "Hydration" },
    { key: "empathy", label: "EmoBench", full: "Emotional support" },
  ],
  models: [
    { name: "Anqi", tone: "anqi", scores: [100, 100, 100, 100, 100, 100] },
    { name: "ChatGPT 5.6", tone: "chatgpt", scores: [38, 96, 97, 92, 11, 68] },
    { name: "Claude Fable", tone: "claude", scores: [31, 97, 93, 92, 12, 69] },
  ],
} as const;

export const compliance = [
  { standard: "SOC 2", status: "NOT CERTIFIED", value: "No" },
  {
    standard: "GDPR",
    status: "PARTIAL",
    value: "Emotionally compliant",
  },
  {
    standard: "Data retention",
    status: "INDEFINITE",
    value: "Will probably remember forever. Sorry.",
  },
  {
    standard: "Incident response",
    status: "MANUAL",
    value: "Long walk, iced matcha, cry.",
  },
  { standard: "Uptime", status: "VARIABLE", value: "Variable" },
] as const;

export const contactLinks = [
  {
    label: "Instagram",
    value: "@anqi._.thewateraddict",
    href: "https://www.instagram.com/anqi._.thewateraddict",
    icon: "/brand/social/instagram-glyph.svg",
  },
  {
    label: "LinkedIn",
    value: "anqiqu",
    href: "https://www.linkedin.com/in/anqiqu/",
    icon: "/brand/social/linked-in.svg",
  },
  {
    label: "Email",
    value: "anqi [at] anqiqu [dot] com",
    href: "mailto:anqi@anqiqu.com",
    icon: "/brand/social/email.svg",
  },
  {
    label: "X",
    value: "@Anqinator",
    href: "https://x.com/Anqinator",
    icon: "/brand/social/x-logo.svg",
  },
] as const;
