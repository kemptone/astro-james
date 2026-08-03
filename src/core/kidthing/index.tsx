import {useState} from 'preact/hooks'
import Dialog from '../../components/Dialog'
import {getKidThingLists} from './data'
import './style.css'

type ChosenName = {
  group: 'P' | 'S'
  name: string
  number: number
}

export default () => {
  const [lists] = useState(getKidThingLists)
  const [chosenNames, setChosenNames] = useState<ChosenName[]>([])
  const [showingMissing, setShowingMissing] = useState(false)
  const Primary = lists.primary
  const Secondary = lists.secondary

  return (
    <Dialog>
      {D2 => (
        <Dialog>
          {D => (
            <main class="colorthing">
              <header class="kid-header">
                <div>
                  <p class="kid-eyebrow">Number picker</p>
                  <h1>Kid Thing</h1>
                  <p>
                    Primary choices use <strong>P</strong>. Secondary choices
                    use <strong>S</strong>.
                  </p>
                </div>
                <a class="kid-settings-link" href="/settings">
                  Settings
                </a>
              </header>

              <section class="readout">
                {chosenNames.length ? (
                  chosenNames.map((choice, index) => (
                    <span class="chosen" key={`${choice.group}-${choice.number}-${index}`}>
                      <b>
                        {choice.group}
                        {choice.number}
                      </b>
                      {choice.name}
                    </span>
                  ))
                ) : (
                  <p class="empty-readout">Press a numbered button to begin.</p>
                )}
              </section>

              <div class="list-label">
                <strong>Primary list</strong>
                <span>P1–P{Primary.length}</span>
              </div>

              <section class="colors">
                {Primary.map((item, index) => (
                  <button
                    key={item + index}
                    aria-label={`Primary ${index + 1}: ${item}`}
                    title={item}
                    onClick={() => {
                      setChosenNames([
                        ...chosenNames,
                        {group: 'P', name: item, number: index + 1},
                      ])
                    }}
                  >
                    <small>P</small>
                    {index + 1}
                  </button>
                ))}

                <button
                  aria-label="Remove the last choice"
                  title="Remove the last choice"
                  onClick={() => {
                    setChosenNames(
                      [...chosenNames].slice(0, chosenNames.length - 1)
                    )
                  }}
                />

                <button
                  aria-label="Show unused primary names"
                  title="Show unused primary names"
                  onClick={() => {
                    D2.openDialog()
                  }}
                >
                  ⏲
                </button>

                <button
                  aria-label="Open the secondary list"
                  title="Open the secondary list"
                  onClick={() => {
                    D.openDialog()
                  }}
                >
                  S
                </button>

                <button
                  aria-label="Clear every choice"
                  title="Clear every choice"
                  onClick={() => {
                    setChosenNames([])
                  }}
                >
                  ♺
                </button>
              </section>

              <D2.Dialog ref={D2.ref}>
                <main className="colorthing">
                  <div className="dialog-heading">
                    <p className="kid-eyebrow">Primary list</p>
                    <h2>Still available</h2>
                  </div>
                  <div className="readout">
                    {Primary.filter(
                      name =>
                        !chosenNames.some(
                          choice => choice.group === 'P' && choice.name === name
                        )
                    ).map(name => {
                      const number = Primary.indexOf(name) + 1
                      return (
                        <span className="chosen" key={`missing-${name}-${number}`}>
                          <b>P{number}</b>
                          {name}
                        </span>
                      )
                    })}
                  </div>
                </main>
              </D2.Dialog>

              <D.Dialog ref={D.ref}>
                <main className="colorthing">
                  <div className="dialog-heading">
                    <p className="kid-eyebrow">Secondary list</p>
                    <h2>S1–S{Secondary.length}</h2>
                  </div>
                  <section className="inner-readout">
                    {showingMissing
                      ? chosenNames.map((choice, index) => (
                          <span class="chosen" key={`dialog-${choice.group}-${choice.number}-${index}`}>
                            <b>
                              {choice.group}
                              {choice.number}
                            </b>
                            {choice.name}
                          </span>
                        ))
                      : null}
                  </section>

                  <div class="colors">
                    <button
                      aria-label="Show or hide chosen names"
                      onClick={() => setShowingMissing(!showingMissing)}
                    >
                      ?
                    </button>
                    {Secondary.map((item, index) => (
                      <button
                        key={item + index}
                        aria-label={`Secondary ${index + 1}: ${item}`}
                        title={item}
                        onClick={() => {
                          setChosenNames([
                            ...chosenNames,
                            {group: 'S', name: item, number: index + 1},
                          ])
                        }}
                      >
                        <small>S</small>
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </main>
              </D.Dialog>
            </main>
          )}
        </Dialog>
      )}
    </Dialog>
  )
}
