import { FunctionalComponent, JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { forwardRef } from "preact/compat";

const Dialog = forwardRef<HTMLDialogElement>(
  (args: JSX.HTMLAttributes<HTMLDialogElement>, ref) => {
    return (
      <dialog {...args} ref={ref}>
        {args.children}
        <form method="dialog">
          <button>✕</button>
        </form>
      </dialog>
    );
  },
);

export default (args: {
  children: (D: {
    openDialog: () => void;
    closeDialog: () => void;
    ref: Ref<HTMLDialogElement>;
    Dialog: FunctionalComponent<{
      ref: Ref<HTMLDialogElement>;
    }>;
  }) => JSX.Element;
}) => {
  const ref_dialog = useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    ref_dialog?.current?.showModal();
  };

  const closeDialog = () => {
    ref_dialog?.current?.close();
  };

  useEffect(() => {
    ref_dialog?.current?.addEventListener(
      "click",
      (ev: PointerEvent) => {
        ev.stopPropagation();

        const target = ev.target as HTMLDialogElement;

        if (target.nodeName === "DIALOG" || target.nodeName === "BUTTON") {
          if (
            ev.offsetX < 0 || ev.offsetX > target.offsetWidth ||
            ev.offsetY < 0 || ev.offsetY > target.offsetHeight
          ) {
            closeDialog();
          }
        }
      },
    );
  });

  return args.children({
    Dialog,
    openDialog,
    closeDialog,
    ref: ref_dialog,
  });
};
