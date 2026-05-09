import { notFound } from "next/navigation";

export default function PartyTestLayout({ children }: { children: React.ReactNode }) {
  // Lab/debug page — never reachable in production builds.
  if (process.env.NODE_ENV === "production") notFound();
  return <>{children}</>;
}
