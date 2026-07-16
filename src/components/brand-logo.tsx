import Image from "next/image";

type Props = {
  /** Logo size in pixels (square). */
  size?: number;
  /** Show the "eBike" wordmark + subtitle next to the mark. */
  withWordmark?: boolean;
  subtitle?: string;
};

/**
 * eBike brand mark. Uses the same logo asset shipped in the mobile apps
 * (ebike_platform/assets/images/ebike_logo.jpg).
 */
export function BrandLogo({ size = 36, withWordmark = true, subtitle }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/ebike_logo.jpg"
        alt="eBike logo"
        width={size}
        height={size}
        className="rounded-[10px] object-cover"
        priority
      />
      {withWordmark ? (
        <div className="leading-tight">
          <p className="text-base font-bold text-foreground">
            eBike <span className="text-brand">Admin</span>
          </p>
          {subtitle ? (
            <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
