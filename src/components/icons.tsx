/**
 * One icon set for the whole page: a single 24px grid and a single stroke
 * weight, so nothing drifts between sections. Brand marks for the tool strip
 * come from `simple-icons` instead — see SkillMarquee.
 */
const sw = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type Size = { size?: number };

export const MailIcon = ({ size = 18 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const PhoneIcon = ({ size = 18 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="M6.5 2.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 4.7 2 2 0 0 1 6.5 2.5Z" />
  </svg>
);

export const PinIcon = ({ size = 18 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const CodeIcon = ({ size = 18 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="m8.5 8.5-4 3.5 4 3.5M15.5 8.5l4 3.5-4 3.5M13.4 5.5l-2.8 13" />
  </svg>
);

export const ArrowIcon = ({ size = 15 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="M5 12h13M12 5l6 7-6 7" />
  </svg>
);

export const OutIcon = ({ size = 15 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const UpIcon = ({ size = 18 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const CopyIcon = ({ size = 16 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
  </svg>
);

export const CheckIcon = ({ size = 16 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const SendIcon = ({ size = 17 }: Size) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...sw}>
    <path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />
  </svg>
);
