export const PROFILE = {
  name: "Do Tan Tuong",
  short: "Tuong",
  role: "Intern Fullstack Developer",
  company: "Dekon",
  age: 22,
  location: "Ho Chi Minh City, Vietnam",
  email: "tantuongdo0206@gmail.com",
  phone: "0901044617",
  github: "https://github.com/Tuong1308",
};

/** What the hero types through, in order. */
export const HERO_ROLES = [
  "Fullstack Developer",
  "React · Next.js · Node.js",
  "PostgreSQL · MongoDB · Docker",
];

export const ABOUT_FACTS: ReadonlyArray<readonly [string, string]> = [
  ["Age", "22"],
  ["Role", "Intern Fullstack Dev @ Dekon"],
  ["Education", "Bachelor of IT"],
  ["Location", "Ho Chi Minh City, Vietnam"],
  ["Status", "Looking for new opportunities"],
];

export const NAV = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export const SKILL_GROUPS = [
  { title: "Languages", items: ["Python", "JavaScript", "TypeScript"] },
  { title: "Frontend", items: ["ReactJS", "NextJS"] },
  { title: "Backend & Data", items: ["NodeJS", "PostgreSQL", "MongoDB"] },
  { title: "Analytics & DevOps", items: ["Power BI", "GA4", "Docker"] },
];

export const EXPERIENCE = {
  company: "Dekon",
  role: "Intern Fullstack Developer",
  when: "Present",
  items: [
    {
      h: "Shipping features end to end",
      p: "Built product features from the ReactJS/NextJS interface down to REST APIs on NodeJS — reusable components, state handling, and a direct line into the data layer.",
      stack: ["ReactJS", "NextJS", "TypeScript", "NodeJS"],
    },
    {
      h: "Designing and querying data",
      p: "Worked across PostgreSQL and MongoDB: schema design, query tuning, and normalising data so it serves both the app and the reporting layer.",
      stack: ["PostgreSQL", "MongoDB", "Python"],
    },
    {
      h: "Measurement and reporting",
      p: "Built Power BI dashboards and configured GA4 to track real user behaviour — turning raw numbers into something the team can decide on.",
      stack: ["Power BI", "GA4"],
    },
    {
      h: "Packaging and deployment",
      p: "Containerised services with Docker and kept dev and staging in sync, so deploys became repeatable instead of risky.",
      stack: ["Docker", "CI/CD"],
    },
  ],
};

export type Project = {
  idx: string;
  name: string;
  tagline: string;
  desc: string;
  points: string[];
  stack: string[];
  live: string;
  repo: string;
  host: string;
};

export const PROJECTS: Project[] = [
  {
    idx: "01",
    name: "UIT Share",
    tagline: "A study-material sharing platform for UIT students",
    desc: "A place for students to upload, search and trade course materials — built around search speed and a reading experience that holds up on a phone.",
    points: [
      "Modern React interface, responsive from phone to desktop",
      "Upload flow with materials classified by course",
      "Continuous deployment on Vercel",
    ],
    stack: ["ReactJS", "NextJS", "TypeScript", "Vercel"],
    live: "https://uit-share-36.vercel.app/",
    repo: "https://github.com/thinh1311ss/UITShare",
    host: "uit-share-36.vercel.app",
  },
  {
    idx: "02",
    name: "UIT Sneakers",
    tagline: "An e-commerce store built for technical SEO",
    desc: "A sneaker store where SEO drove the architecture: page structure, metadata, load speed and structured data, all aimed at ranking.",
    points: [
      "On-page SEO: semantic HTML, meta tags, sitemap, schema",
      "Category and product detail pages, shopping cart",
      "User behaviour tracked with GA4",
    ],
    stack: ["NextJS", "SEO", "GA4", "JavaScript"],
    live: "https://www.uitsneakers.io.vn/",
    repo: "https://github.com/Tuong1308/Sneaker-store-website-for-SEO",
    host: "uitsneakers.io.vn",
  },
];

export const EDUCATION = [
  {
    yr: "Bachelor",
    h: "Bachelor of Information Technology",
    p: "Grounding in data structures, algorithms, databases and software engineering — the base for how I approach every product problem.",
  },
  {
    yr: "Self-taught",
    h: "Fullstack & Data",
    p: "Learning through real projects: React and Next on the front, NodeJS on the API, Power BI and GA4 at the measurement layer.",
  },
];
