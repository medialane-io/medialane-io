import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@medialane/ui/card";
import { ShieldCheck } from "lucide-react";

interface AccountCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function AccountCard({ title, description, children }: AccountCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
