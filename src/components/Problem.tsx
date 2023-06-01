interface MathProblem {
  num1 : number
  , num2 : number
  , answer : number
  , act? : string
  , equals? : string
  , onSubmit : () => void
  , step : number
  , onFocus : () => null
}

export const Problem = (props: MathProblem) => {

  const {
    num1 = 0
    , num2 = 0
    , answer = 0
    , act = "÷"
    , equals = "="
    , onSubmit
    , step
    , onFocus
  } = props;

  const f = new Function()

  return (
    <form key={ step } class="problem" onSubmit={ e => {
      e.preventDefault()
      onFocus()
      onSubmit(e)
    } }>
      <span className="group">
        <span class="num1">{num1}</span>
        <span class="act">{act}</span>
        <span class="num2">{num2}</span>
        <span class="equals">{equals}</span>
      </span>
      <span className="group">
        <input 
          type="text" 
          name="answer" 
          pattern={ `${ answer }` }
          inputMode="numeric"
          onFocus={ onFocus }
          onChange={ e => {
            onFocus()
            const target = e.target as HTMLInputElement;
            if (target?.validity?.patternMismatch) {
              target?.setCustomValidity(`What does ${ num1 } ${ act } ${ num2 } ${ equals }`)
            } else {
              target?.setCustomValidity('')
            }
          }}
          required 
          autoComplete="off"
          autoCorrect="off"
        />
        <button type="submit">⏎</button>
      </span>
    </form>
  );
};
