interface DiscordIconProps {
  size?: number;
  className?: string;
}

export function DiscordIcon({ size = 14, className }: DiscordIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20 4.4A20 20 0 0 0 15 3l-.2.4a18 18 0 0 0-5.6 0L9 3a20 20 0 0 0-5 1.4A21 21 0 0 0 .5 17.4 20 20 0 0 0 6.6 20.4l.5-.7a14 14 0 0 1-2.2-1.1l.6-.4a14 14 0 0 0 13 0l.6.4a14 14 0 0 1-2.2 1.1l.5.7a20 20 0 0 0 6.1-3 21 21 0 0 0-3.5-13zM8.5 15.4c-1.2 0-2.2-1.1-2.2-2.5s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.5-2.2 2.5zm7 0c-1.2 0-2.2-1.1-2.2-2.5s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.5-2.2 2.5z" />
    </svg>
  );
}
