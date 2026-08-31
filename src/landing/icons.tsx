import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={24}
      height={24}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h12" />
      <path d="M16 12h.01" />
    </IconBase>
  );
}

export function IconSplit(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7.8 8.6 10.4 16M16.2 8.6 13.6 16" />
    </IconBase>
  );
}

export function IconBalance(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v3M5 10h14M7.5 10 5 16h5l-2.5-6ZM16.5 10 14 16h5l-2.5-6ZM12 6v14" />
    </IconBase>
  );
}

export function IconLink(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18.07" />
    </IconBase>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16 19a4.8 4.8 0 0 1 4.5-4" />
    </IconBase>
  );
}

export function IconUser(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </IconBase>
  );
}

export function IconCode(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
    </IconBase>
  );
}

export function IconGithub(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={20} height={20} {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.43.21 2.49.1 2.75.64.72 1.03 1.64 1.03 2.76 0 3.96-2.34 4.82-4.58 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 4h6v6M20 4l-9 9M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" />
    </IconBase>
  );
}

export const featureIcons = {
  wallet: IconWallet,
  split: IconSplit,
  balance: IconBalance,
  link: IconLink,
  users: IconUsers,
  user: IconUser,
  globe: IconGlobe,
  code: IconCode,
} as const;
