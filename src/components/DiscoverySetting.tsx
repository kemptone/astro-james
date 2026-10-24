import {useEffect, useState} from 'preact/hooks'
import {
  readSettings,
  saveSettings,
  SETTINGS_EVENT,
} from '../core/sro25/settings'

export default function DiscoverySetting() {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const sync = () => setEnabled(readSettings().enabled)
    sync()
    window.addEventListener(SETTINGS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SETTINGS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return (
    <section>
      <label style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          onChange={event => {
            try {
              saveSettings({
                ...readSettings(),
                enabled: event.currentTarget.checked,
              })
              setError('')
            } catch {
              setError(
                'Your browser could not save this setting. Allow site storage and try again.',
              )
            }
          }}
        />
        Discovery Tour
      </label>
      <p>
        In SRO25, explore the plug and labeled ranges with a talking guide. The
        gas valve is hidden and disabled during the tour.
      </p>
      <p>
        Return to the menu and choose SRO25 to begin. Change the voice in its
        Debug panel.
      </p>
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
