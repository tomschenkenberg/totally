"use client";

import Link from "next/link";

export default function MainMenu() {
  return (
    <div className="flex justify-center">
      <nav className="isolate inline-flex rounded-md shadow-sm">
        <Link href="/">
          <button
            type="button"
            className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
            Scoreboard
          </button>
        </Link>
        <Link href="/players">
          <button
            type="button"
            className="relative -ml-px inline-flex items-center bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
            Players
          </button>
        </Link>
        <button
          type="button"
          className="relative -ml-px inline-flex items-center rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
          Scores
        </button>
      </nav>
    </div>
  );
}
