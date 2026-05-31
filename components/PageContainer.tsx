import type { ReactNode } from "react";

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      {children}
    </section>
  );
}