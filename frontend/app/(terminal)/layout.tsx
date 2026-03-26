import { PlanSureShell } from "@/components/terminal-ui";

export default function TerminalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PlanSureShell>{children}</PlanSureShell>;
}
