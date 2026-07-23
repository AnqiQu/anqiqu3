export const navigation = [
  { label: "Overview", href: "/#overview" },
  { label: "Specs", href: "/#specs" },
  { label: "Changelog", href: "/#changelog" },
  { label: "Comparison", href: "/#comparison" },
  { label: "Compliance", href: "/#compliance" },
] as const;

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
  {
    label: "Training background",
    value: "Machine learning, statistics, economics, debate",
  },
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
  { label: "Preferred energy sources", value: "Soup, sushi, steak" },
] as const;

export const knownIssues = [
  {
    id: "BUG-001",
    text: "Sometimes breaks when touching grass (especially pollened grass)",
  },
  { id: "BUG-002", text: "Occasional issues with timezone adjustment" },
  {
    id: "BUG-003",
    text: "Highly variable battery life depending on use",
  },
  { id: "BUG-004", text: "May require a reboot during the day" },
  { id: "BUG-005", text: "Heavily dependent on solar power" },
] as const;

export const changelog = [
  {
    year: "2025",
    text: "Model fine-tuning begins at the University of Oxford.",
    details:
      "Rhodes Scholar. Interested in reinforcement learning, autonomous agents, strategic game theory, training efficiency, and AI alignment more broadly.",
  },
  {
    year: "2021",
    text: "Model pretraining begins at the University of Chicago.",
    details: "Economics, Statistics, Computer Science",
  },
] as const;

export const comparisons = [
  { capability: "Can write emails", anqi: "Yes", chatgpt: "Yes" },
  { capability: "Knows machine learning", anqi: "Yes", chatgpt: "Yes" },
  {
    capability: "Multimodal support",
    anqi: "Text, image, voice, touch",
    chatgpt: "Text, image, voice",
  },
  { capability: "Hallucinations", anqi: "Yes", chatgpt: "Yes" },
  {
    capability: "Maintains social context",
    anqi: "Yes",
    chatgpt: "Sometimes",
  },
  { capability: "Has South Africa lore", anqi: "Yes", chatgpt: "No" },
  { capability: "Available for coffee", anqi: "Yes", chatgpt: "No" },
] as const;

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
    value: "Long walk, Notes app, iced matcha",
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
