import { Card, CardContent, CardDescription, CardTitle } from "@medialane/ui/card";
import { ShieldCheck } from "lucide-react";
import { IconTile } from "@medialane/ui";

interface AccountHeadingProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function AccountHeading({ title, description, icon = <ShieldCheck /> }: AccountHeadingProps) {
  return (
    <div className="flex flex-col items-center space-y-1.5 text-center">
      <div className="mb-2">
        <IconTile>{icon}</IconTile>
      </div>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </div>
  );
}

interface AccountCardProps extends Partial<AccountHeadingProps> {
  children?: React.ReactNode;
}

/** Without a title, the content brings its own heading. */
export function AccountCard({ title, description, icon, children }: AccountCardProps) {
  return (
    <Card className="w-full max-w-sm">
      {title && (
        <div className="p-6">
          <AccountHeading title={title} description={description} icon={icon} />
        </div>
      )}
      <CardContent className={title ? undefined : "pt-6"}>{children}</CardContent>
    </Card>
  );
}
