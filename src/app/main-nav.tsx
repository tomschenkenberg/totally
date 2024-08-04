import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MainMenu() {
  const common =
    "relative inline-flex items-center bg-white px-3 py-2 text-xl font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10";
  const NavButton = ({
    label,
    className,
    href,
  }: {
    label: string;
    className: string;
    href: string;
  }) => (
    <Link href={href}>
      <button type="button" className={cn(common, className)}>
        {label}
      </button>
    </Link>
  );

  return (
    <div className="flex justify-center">
      <nav className="isolate inline-flex rounded-md shadow-sm flex-wrap">
        <NavButton label="Scoreboard" className="rounded-l-md" href="/" />
        <NavButton label="Scores" className="-ml-px" href="/scores" />
        <NavButton label="Players" className="-ml-px" href="/players" />
        <NavButton
          label="Sharing"
          className="-ml-px rounded-r-md"
          href="/sharing"
        />
      </nav>
    </div>
  );
}
