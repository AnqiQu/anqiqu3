export type SandboxContentItem = {
  slug: string;
  title: string;
  summary?: string;
  date?: string;
  status?: string;
  tags?: string[];
  internalPath?: string;
  externalUrl?: string;
  pdfUrl?: string;
  image?: string;
  featured?: boolean;
};

// Content remains intentionally empty at the static-world review checkpoint.
// Populate only with supplied, verified personal material in the next phase.
export const sandboxResearch: SandboxContentItem[] = [];
export const sandboxArchive: SandboxContentItem[] = [];
export const sandboxPreferences: SandboxContentItem[] = [];
export const sandboxIdeas: SandboxContentItem[] = [];
export const sandboxDogs: SandboxContentItem[] = [];
