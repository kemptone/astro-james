import Buttons from "../components/CalculatorButtons.tsx";
import Values from "../components/CalculatorValues.tsx";
import Log from "../components/CalculatorLog.tsx";
import Dialog from "../components/Dialog.tsx";

export default () => {
  return (
    <Dialog>
      {(D) => (
        <div class="main2">
          <div class="calculator meta-grid">
            <Log />
            <div class="calculator-grid">
              <Values />
              <Buttons {...{ D }} />
            </div>
            <D.Dialog ref={D.ref}>
              <Log />
            </D.Dialog>
          </div>
        </div>
      )}
    </Dialog>
  );
};
