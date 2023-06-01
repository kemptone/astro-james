import { MainNumber, LogLine } from '../data/Calculations2.ts';

export default () => {

  return (
    <>
      <div class="i">
        <div>{MainNumber.value || "0"}</div>
        <div class="i2">{ LogLine.value }</div>
      </div>
    </>
  )

}
