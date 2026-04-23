import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";

export default function BrLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={ptBR}>
      {children}
    </ClerkProvider>
  );
}
