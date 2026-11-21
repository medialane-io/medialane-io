"use client";

import Link from "@medialane/ui/link";
import { useNavCommandMenu, ActionButton } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useMediaWallet } from "@medialane/ui";
import { UserShieldIcon } from "@/components/icons/user-shield-icon";
import { useT } from "@medialane/ui/i18n";

export function NavConnectButton() {
  const t = useT();
  const { hasWallet } = useWalletNativeSession();
  const { close: closeMenu } = useNavCommandMenu();
  const { open: openWalletPanel } = useMediaWallet();

  if (!hasWallet) {
    return (
      <span className="flex shrink-0 items-center gap-2.5 text-2xs text-muted-foreground/50">
        <ActionButton solid small asChild>
          <Link href="/connect" onClick={closeMenu}>
            <UserShieldIcon className="h-3.5 w-3.5" />
            {t("Account")}
          </Link>
        </ActionButton>
        <Kbd />
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-2.5 text-2xs text-muted-foreground/50">
      <button
        type="button"
        onClick={() => {
          closeMenu();
          openWalletPanel();
        }}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: "hsl(var(--brand-blue))" }}
      >
        <UserShieldIcon className="h-3.5 w-3.5 text-white" />
        {t("Account")}
      </button>
      <Kbd />
    </span>
  );
}

function Kbd() {
  return (
    <kbd className="hidden min-w-[18px] items-center justify-center rounded-md bg-muted/60 px-1.5 py-0.5 font-sans text-2xs leading-none text-muted-foreground sm:inline-flex">
      ⌘K
    </kbd>
  );
}
