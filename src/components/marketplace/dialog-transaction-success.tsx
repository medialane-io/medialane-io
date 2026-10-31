import { TransactionSuccess } from "@medialane/ui";
import type { ComponentProps } from "react";

// The success state for dialogs whose content has no padding of its own.
export function DialogTransactionSuccess(props: ComponentProps<typeof TransactionSuccess>) {
  return (
    <div className="px-6 pb-6 pt-4">
      <TransactionSuccess {...props} />
    </div>
  );
}
