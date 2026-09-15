/** The layers a request passes through, in order — shared by the scene and its legend. */
export type Stage = { id: string; title: string; sub: string };

export const STAGES: Stage[] = [
  { id: "ui", title: "Browser", sub: "React · Next.js" },
  { id: "api", title: "API", sub: "Node.js · REST" },
  { id: "db", title: "Database", sub: "PostgreSQL · MongoDB" },
  { id: "ship", title: "Docker", sub: "Build · Deploy" },
  { id: "data", title: "Insight", sub: "Power BI · GA4" },
];
