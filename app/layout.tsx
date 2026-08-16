import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Incident Copilot",
  description: "Investigate customer issues using historical incident evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <template
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: A support case file, not a chat. The engineer describes symptoms, then reads likely cause, ordered next checks, and cited incidents in one viewport. Refuses chatbot bubbles and a marketing hero.
OWN-WORLD: Off-white desk, white paper panels, hairline borders, Geist, one violet reserved for Investigate and selected evidence.
STORY: Type what the customer is seeing, run an investigation, verify historical sources in place.
FIRST VIEWPORT: Compact product bar. Composer is the primary action. Below it, a two-column case file — likely cause and plan on the left, inspectable incidents on the right. Investigate sits in the composer footer.
FORM: Operate / restrained engineering console. Seed: n/a — precise request, no concept roll. Signature interaction: inspect an incident in a right sheet without leaving the case.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
