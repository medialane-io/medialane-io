import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@medialane/ui/card";
import { ShieldCheck } from "lucide-react";
import { IconTile } from "@medialane/ui";

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
          <IconTile>
            <ShieldCheck />
          </IconTile>
        </div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
