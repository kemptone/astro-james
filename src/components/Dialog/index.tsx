import type { FunctionalComponent, JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { forwardRef } from "preact/compat";
import './dialog.css'

const Dialog = forwardRef<HTMLDialogElement>(
  (args: JSX.HTMLAttributes<HTMLDialogElement>, ref) => {
    return (
      <dialog className="dd" {...args} ref={ref}>
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
    const dialog = ref_dialog.current;

    if (!dialog) {
      return;
    }

    const handleClick = (ev: MouseEvent) => {
      ev.stopPropagation();

      if (ev.target !== dialog) {
        return;
      }

      const bounds = dialog.getBoundingClientRect();
      const offsetX = ev.clientX - bounds.left;
      const offsetY = ev.clientY - bounds.top;

      if (
        offsetX < 0 || offsetX > bounds.width ||
        offsetY < 0 || offsetY > bounds.height
      ) {
        closeDialog();
      }
    };

    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("click", handleClick);
    };
  }, []);

  return args.children({
    Dialog,
    openDialog,
    closeDialog,
    ref: ref_dialog,
  });
};
