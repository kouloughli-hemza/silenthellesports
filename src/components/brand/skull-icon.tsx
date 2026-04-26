interface SkullIconProps {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
}

export function SkullIcon({
  size = 16,
  color = "#E60013",
  className,
  title,
}: SkullIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill={color}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M12 1c-1 2 1 3 0 5-1.5-1-2-2.5-2-2.5s-.5 2.5 1 4c-1.2-.2-2-1-2-1s0 2 2 2.8c-1 0-1.8-.3-1.8-.3s.5 1.3 2.3 1.7c1.5 0 3-.5 3.5-2 .3-1.5-.3-3-1.5-4 1 .3 1.5 1 1.5 1s.2-2-1-3.2c.5.3 1 .8 1 .8S14 1 12 1z"
        opacity="0.9"
      />
      <ellipse cx="12" cy="14" rx="5.5" ry="5" />
      <rect x="9" y="18" width="6" height="3" />
      <rect x="10" y="20" width="1" height="2" fill="#0A0A0A" />
      <rect x="13" y="20" width="1" height="2" fill="#0A0A0A" />
      <ellipse cx="9.8" cy="14" rx="1.3" ry="1.6" fill="#0A0A0A" />
      <ellipse cx="14.2" cy="14" rx="1.3" ry="1.6" fill="#0A0A0A" />
      <rect x="11.5" y="16" width="1" height="2" fill="#0A0A0A" />
    </svg>
  );
}
