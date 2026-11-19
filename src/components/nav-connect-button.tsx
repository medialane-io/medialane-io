"use client";

import Link from "@medialane/ui/link";
import { useNavCommandMenu } from "@medialane/ui";
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
      <span className="flex shrink-0 items-center">
        <div className="btn-border-animated rounded-lg p-[1px]">
          <Link
            href="/connect"
            onClick={closeMenu}
            className="flex items-center gap-1.5 rounded-[7px] bg-transparent px-2.5 py-1 text-2xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <UserShieldIcon className="h-3 w-3" />
            {t("Connect")}
          </Link>
        </div>
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => {
          closeMenu();
          openWalletPanel();
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-2xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: "hsl(var(--brand-blue))" }}
      >
        <UserShieldIcon className="h-3 w-3 text-white" />
        {t("Connect")}
      </button>
    </span>
  );
}
