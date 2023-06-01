import { Log } from '../data/Calculations2.ts';

export default e => {

  return (
    <>
      <div class="log">
        {(Log.value || [])?.map?.( (line, index) => {
          return (
            <div key={line + index }>
              { line }
            </div>
          )
        })}
      </div>
    </>
  )

}
