import Image from "next/image";
import Link from "next/link";

const SIZES = {
  sm: 28,
  md: 36,
  lg: 56,
  xl: 72,
} as const;

type AppLogoProps = {
  size?: keyof typeof SIZES;
  showText?: boolean;
  href?: string;
  className?: string;
  textClassName?: string;
};

export default function AppLogo({
  size = "md",
  showText = true,
  href,
  className = "",
  textClassName = "",
}: AppLogoProps) {
  const px = SIZES[size];

  const content = (
    <>
      <span className="inline-flex shrink-0 rounded-3xl overflow-hidden bg-accent-light shadow-sm ring-1 ring-primary/15 p-0.5">
        <Image
          src="/logo.png"
          alt="Fast Cedu"
          width={px}
          height={px}
          className="rounded-3xl"
          priority
        />
      </span>
      {showText && (
        <span className={`font-bold text-primary ${textClassName}`}>
          Fast Cedu
        </span>
      )}
    </>
  );

  const wrapperClass = `inline-flex items-center gap-2 ${className}`;

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
