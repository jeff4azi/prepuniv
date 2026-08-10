import { ReactNode } from "react";
import { LandingTopNav } from "../components/LandingTopNav";

interface LegalPageProps {
  title: string;
  updated: string; // e.g. "2026‑08‑10"
  children: ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <>
      <LandingTopNav />
      <main className="flex justify-center px-4 sm:px-6 lg:px-8 py-12 bg-background text-text">
        <article className="max-w-[740px] w-full space-y-6">
          <header className="space-y-2">
            <h1 className="font-heading text-4xl font-medium text-primary">{title}</h1>
            <p className="text-sm text-text-soft">Last updated: {updated}</p>
          </header>
          {/* Simple in‑page table of contents – optional */}
          <nav className="border-b border-border/40 pb-4 mb-6">
            <ul className="list-disc list-inside space-y-1 text-sm text-text-soft">
              {/* The page will manually add anchor links above each section */}
            </ul>
          </nav>
          <section className="prose max-w-none text-base leading-relaxed text-text">
            {children}
          </section>
        </article>
      </main>
    </>
  );
}
