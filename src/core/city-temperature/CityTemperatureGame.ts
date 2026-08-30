import {authClient} from '@/lib/auth-client'
import {
  DEFAULT_TEMPERATURES,
  MAX_CITIES,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
  createEmptyMapState,
  getCityTemperature,
  getTemperaturePresentation,
  mapHasContent,
  mapsAreEqual,
  temperaturesAreOrdered,
  validateMapState,
  type City,
  type ClimateMode,
  type FeatureEntitlements,
  type MapState,
  type PaidFeature,
  type Position,
} from './domain'

const STORAGE_KEY = 'city-temperature-game:v1'

interface GameConfiguration {
  accountsConfigured: boolean
  googleEnabled: boolean
  purchaseMode: 'mock'
}

interface RemoteStateResponse {
  map: MapState | null
  version: number
  entitlements: FeatureEntitlements
}

interface ConflictState {
  map: MapState
  version: number
}

function makeId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}_${random.replaceAll('-', '_')}`
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value))
}

class CityTemperatureGame extends HTMLElement {
  private state: MapState = createEmptyMapState()
  private entitlements: FeatureEntitlements = {
    heater: false,
    connections: false,
  }
  private configuration: GameConfiguration = {
    accountsConfigured: false,
    googleEnabled: false,
    purchaseMode: 'mock',
  }
  private session: any = null
  private remoteVersion = 0
  private conflictState: ConflictState | null = null
  private selectedPosition: Position = {x: 50, y: 50}
  private editingCityId: string | null = null
  private movingCityId: string | null = null
  private pendingMockFeature: PaidFeature | null = null
  private saveTimer: number | undefined
  private resizeObserver: ResizeObserver | null = null
  private root!: ShadowRoot

  connectedCallback() {
    this.root = this.attachShadow({mode: 'open'})
    this.state = this.loadLocalState()
    this.entitlements = this.loadMockEntitlements()
    this.renderShell()
    this.bindEvents()
    this.renderGame()
    this.resizeObserver = new ResizeObserver(() => this.drawConnections())
    this.resizeObserver.observe(this.getElement<HTMLElement>('map'))
    void this.initializeOnlineFeatures()
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect()
    if (this.saveTimer) window.clearTimeout(this.saveTimer)
  }

  private getElement<T extends Element>(id: string): T {
    const element = this.root.getElementById(id)
    if (!element) throw new Error(`Missing #${id}`)
    return element as unknown as T
  }

  private renderShell() {
    this.root.innerHTML = `
      <style>
        :host {
          --navy: #102a43;
          --teal: #0f766e;
          --teal-deep: #115e59;
          --ice: #ecfeff;
          --sky: #cffafe;
          --warm: #fff7ed;
          --line: rgba(15, 76, 92, 0.18);
          display: block;
          min-height: 100vh;
          color: var(--navy);
          background:
            radial-gradient(circle at 8% 5%, rgba(255, 255, 255, 0.95), transparent 26rem),
            linear-gradient(145deg, #ecfeff, #e0f2fe 55%, #fff7ed);
          font-family: ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * { box-sizing: border-box; }
        [hidden] { display: none !important; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }

        .shell { width: min(1460px, calc(100% - 28px)); margin: 0 auto; padding: 30px 0 54px; }
        .hero, .panel {
          border: 1px solid rgba(255, 255, 255, 0.82);
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 20px 55px rgba(15, 76, 92, 0.14);
          backdrop-filter: blur(18px);
        }

        .hero { border-radius: 28px; padding: 26px; }
        .hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
        .eyebrow { margin: 0 0 6px; color: var(--teal); font-weight: 800; letter-spacing: .08em; text-transform: uppercase; font-size: .78rem; }
        h1 { margin: 0; font-size: clamp(2rem, 5vw, 4.25rem); line-height: 1; letter-spacing: -.045em; }
        .lede { max-width: 65ch; margin: 12px 0 0; color: #486581; font-size: 1.05rem; }
        .hero-actions { display: flex; flex: 0 0 auto; flex-wrap: wrap; gap: 8px; }

        .mode-selector { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 24px; }
        .mode-button {
          min-height: 74px;
          border: 2px solid transparent;
          border-radius: 18px;
          padding: 12px;
          background: rgba(224, 242, 254, .72);
          color: var(--navy);
          text-align: left;
          transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
        }
        .mode-button:hover { transform: translateY(-2px); }
        .mode-button[aria-pressed="true"] { border-color: var(--teal); background: white; box-shadow: 0 9px 24px rgba(15,118,110,.12); }
        .mode-number { display: block; color: var(--teal); font-size: .75rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .mode-name { display: block; margin-top: 2px; font-size: 1.05rem; font-weight: 850; }
        .mode-note { display: block; margin-top: 3px; color: #627d98; font-size: .8rem; }
        .lock-badge, .owned-badge { display: inline-block; margin-left: 6px; padding: 2px 7px; border-radius: 99px; font-size: .7rem; vertical-align: 2px; }
        .lock-badge { background: #ffedd5; color: #9a3412; }
        .owned-badge { background: #ccfbf1; color: #115e59; }

        .workspace { display: grid; grid-template-columns: minmax(300px, 390px) minmax(0, 1fr); gap: 18px; margin-top: 18px; }
        .panel { border-radius: 24px; padding: 20px; }
        .controls { display: grid; gap: 18px; align-content: start; }
        .panel h2, .panel h3 { margin-top: 0; }
        .panel h2 { margin-bottom: 4px; font-size: 1.35rem; }
        .hint { margin: 0; color: #627d98; font-size: .9rem; line-height: 1.45; }

        form { display: grid; gap: 12px; }
        label { display: grid; gap: 5px; color: #334e68; font-size: .83rem; font-weight: 800; }
        input, select {
          width: 100%;
          min-height: 44px;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 9px 11px;
          background: rgba(255,255,255,.9);
          color: var(--navy);
        }
        input:focus, select:focus, button:focus-visible { outline: 3px solid rgba(8,145,178,.28); outline-offset: 2px; }
        .temperature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .temperature-grid label { font-size: .76rem; }
        .position-readout { padding: 9px 11px; border-radius: 12px; background: var(--ice); color: #155e75; font-size: .82rem; }
        .button-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .button {
          min-height: 42px;
          border: 0;
          border-radius: 12px;
          padding: 9px 14px;
          background: var(--teal);
          color: white;
          font-weight: 800;
        }
        .button:hover { background: var(--teal-deep); }
        .button.secondary { background: #e0f2fe; color: #164e63; }
        .button.secondary:hover { background: #bae6fd; }
        .button.danger { background: #fee2e2; color: #991b1b; }
        .button.danger:hover { background: #fecaca; }
        .button:disabled { cursor: not-allowed; opacity: .55; }

        .connection-box { position: relative; border-top: 1px solid var(--line); padding-top: 17px; }
        .connection-lock { margin-top: 10px; border: 1px dashed #fb923c; border-radius: 14px; padding: 12px; background: #fff7ed; color: #9a3412; }
        .connection-lock p { margin: 0 0 9px; font-size: .86rem; }
        .connection-form { grid-template-columns: 1fr 1fr; align-items: end; }
        .connection-form .button { grid-column: 1 / -1; }

        .city-list, .connection-list { display: grid; gap: 8px; margin-top: 12px; max-height: 390px; overflow: auto; }
        .city-card, .connection-card { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 12px; }
        .city-card-head { display: flex; align-items: center; gap: 9px; }
        .swatch { width: 22px; height: 22px; flex: 0 0 auto; border: 1px solid rgba(0,0,0,.24); border-radius: 7px; }
        .city-title { min-width: 0; flex: 1; font-weight: 900; overflow-wrap: anywhere; }
        .active-temperature { font-variant-numeric: tabular-nums; font-weight: 900; }
        .temperatures { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; color: #627d98; font-size: .75rem; }
        .temperature-pill { padding: 3px 7px; border-radius: 99px; background: #f0f9ff; }
        .card-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
        .small-button { border: 0; border-radius: 9px; padding: 5px 8px; background: #e0f2fe; color: #164e63; font-size: .75rem; font-weight: 800; }
        .small-button.danger { background: #fee2e2; color: #991b1b; }
        .empty { padding: 16px; border: 1px dashed var(--line); border-radius: 14px; color: #829ab1; text-align: center; font-size: .88rem; }

        .map-panel { min-width: 0; }
        .map-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .map {
          position: relative;
          min-height: 650px;
          overflow: hidden;
          border: 2px solid rgba(14,116,144,.18);
          border-radius: 22px;
          background-color: #fff;
          background-image:
            linear-gradient(rgba(14,116,144,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,116,144,.055) 1px, transparent 1px),
            radial-gradient(circle at center, #fff 0, #f0fdfa 100%);
          background-size: 32px 32px, 32px 32px, auto;
          cursor: crosshair;
        }
        .connection-canvas, .marker-layer { position: absolute; inset: 0; width: 100%; height: 100%; }
        .connection-canvas { pointer-events: none; overflow: visible; }
        .marker-layer { pointer-events: none; }
        .city-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          border: 0;
          border-radius: 12px;
          padding: 7px 10px;
          background: rgba(255,255,255,.88);
          box-shadow: 0 6px 20px rgba(15,76,92,.16);
          font-weight: 950;
          white-space: nowrap;
          text-shadow: 0 1px 0 white, 0 0 5px white;
        }
        .city-marker:hover { z-index: 3; transform: translate(-50%, -50%) scale(1.05); }
        .pending-marker { position: absolute; width: 18px; height: 18px; transform: translate(-50%, -50%); border: 4px solid white; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 2px var(--teal), 0 7px 15px rgba(15,118,110,.26); pointer-events: none; }
        .fire { display: inline-block; margin-left: 3px; text-shadow: none; }
        .status { min-height: 1.4em; margin: 10px 0 0; color: #486581; font-size: .88rem; }
        .status.error { color: #b91c1c; }
        .status.success { color: #047857; }

        dialog { width: min(520px, calc(100% - 24px)); max-height: 90vh; overflow: auto; border: 0; border-radius: 24px; padding: 0; color: var(--navy); box-shadow: 0 28px 90px rgba(15,23,42,.35); }
        dialog::backdrop { background: rgba(15,23,42,.55); backdrop-filter: blur(4px); }
        .dialog-body { padding: 22px; }
        .dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .dialog-head h2 { margin: 0; }
        .close-button { width: 38px; height: 38px; border: 0; border-radius: 50%; background: #e2e8f0; color: #334155; font-size: 1.2rem; }
        .auth-grid { display: grid; gap: 14px; margin-top: 18px; }
        .auth-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px; }
        .auth-card h3 { margin: 0 0 10px; }
        .google-button { width: 100%; background: #1f2937; }
        .account-summary { display: grid; gap: 10px; margin-top: 16px; }
        .sync-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
        .fine-print { color: #718096; font-size: .76rem; line-height: 1.45; }

        @media (max-width: 900px) {
          .workspace { grid-template-columns: 1fr; }
          .map-panel { grid-row: 1; }
          .map { min-height: 520px; }
        }

        @media (max-width: 620px) {
          .shell { width: min(100% - 16px, 1460px); padding-top: 14px; }
          .hero, .panel { border-radius: 19px; padding: 15px; }
          .hero-top { display: grid; }
          .hero-actions { justify-self: start; }
          .mode-selector { grid-template-columns: 1fr; }
          .temperature-grid { grid-template-columns: 1fr; }
          .connection-form { grid-template-columns: 1fr; }
          .map { min-height: 450px; }
          .sync-actions { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
        }
      </style>

      <main class="shell">
        <section class="hero" aria-labelledby="game-title">
          <div class="hero-top">
            <div>
              <p class="eyebrow">Build a map · compare temperatures</p>
              <h1 id="game-title">City Temperature Game</h1>
              <p class="lede">Place your cities, give each one Heater, Normal, and Air Conditioner temperatures, then switch the whole map between the three options.</p>
            </div>
            <div class="hero-actions">
              <button class="button secondary" id="purchaseSettingsButton" type="button">Pretend purchases</button>
              <button class="button secondary" id="accountButton" type="button">Account</button>
            </div>
          </div>

          <div class="mode-selector" role="group" aria-label="Climate option">
            <button class="mode-button" id="heaterMode" data-mode="heater" type="button" aria-pressed="false">
              <span class="mode-number">Option 1</span>
              <span class="mode-name">Heater 🔥 <span id="heaterPrice" class="lock-badge">🔒 $20 demo</span></span>
              <span class="mode-note">Show each city's warmest value</span>
            </button>
            <button class="mode-button" data-mode="normal" type="button" aria-pressed="true">
              <span class="mode-number">Option 2</span>
              <span class="mode-name">Normal</span>
              <span class="mode-note">The free everyday temperature</span>
            </button>
            <button class="mode-button" data-mode="air-conditioner" type="button" aria-pressed="false">
              <span class="mode-number">Option 3</span>
              <span class="mode-name">Air Conditioner ❄️</span>
              <span class="mode-note">Show each city's cooler value</span>
            </button>
          </div>
        </section>

        <div class="workspace">
          <aside class="panel controls" aria-label="City controls">
            <section>
              <h2 id="cityFormTitle">Add a city</h2>
              <p class="hint">Click the map to choose a spot, then save the city.</p>
              <form id="cityForm">
                <label>City name
                  <input id="cityName" name="name" maxlength="80" autocomplete="off" required placeholder="e.g. Frost Harbor" />
                </label>
                <div class="temperature-grid">
                  <label>Heater 🔥
                    <input id="heaterTemperature" type="number" min="-100" max="164" step="1" value="80" required />
                  </label>
                  <label>Normal
                    <input id="normalTemperature" type="number" min="-100" max="164" step="1" value="70" required />
                  </label>
                  <label>AC ❄️
                    <input id="acTemperature" type="number" min="-100" max="164" step="1" value="60" required />
                  </label>
                </div>
                <div class="position-readout" id="positionReadout">Map position: 50.0%, 50.0%</div>
                <div class="button-row">
                  <button class="button" id="saveCityButton" type="submit">Add city</button>
                  <button class="button secondary" id="cancelEditButton" type="button" hidden>Cancel edit</button>
                  <button class="button danger" id="clearMapButton" type="button">Clear map</button>
                </div>
              </form>
              <p class="status" id="status" role="status" aria-live="polite"></p>
              <div class="city-list" id="cityList"></div>
            </section>

            <section class="connection-box">
              <h2>Connect Lines <span id="connectionsPrice" class="lock-badge">🔒 $20 demo</span></h2>
              <p class="hint">Draw a line between two different cities.</p>
              <div class="connection-lock" id="connectionLock">
                <p>Connection Lines has a separate pretend $20 purchase. No real money is charged.</p>
                <button class="button" id="buyConnectionsButton" type="button">Pretend to purchase for $20</button>
              </div>
              <form class="connection-form" id="connectionForm" hidden>
                <label>From city<select id="fromCity"></select></label>
                <label>To city<select id="toCity"></select></label>
                <button class="button" type="submit">Add connection</button>
              </form>
              <div class="connection-list" id="connectionList"></div>
            </section>
          </aside>

          <section class="panel map-panel" aria-labelledby="map-title">
            <div class="map-toolbar">
              <div>
                <h2 id="map-title">Your city map</h2>
                <p class="hint" id="mapHint">Click anywhere to place the next city.</p>
              </div>
              <span id="saveState" class="hint">Saved in this browser</span>
            </div>
            <div class="map" id="map" aria-label="Blank map for placing cities">
              <svg class="connection-canvas" id="connectionCanvas" aria-hidden="true"></svg>
              <div class="marker-layer" id="markerLayer"></div>
              <span class="pending-marker" id="pendingMarker" aria-hidden="true"></span>
            </div>
          </section>
        </div>
      </main>

      <dialog id="accountDialog">
        <div class="dialog-body">
          <div class="dialog-head">
            <div><p class="eyebrow">Save and unlock</p><h2>Your account</h2></div>
            <button class="close-button" data-close-dialog="accountDialog" type="button" aria-label="Close">×</button>
          </div>
          <p class="hint" id="accountMessage">Checking your account…</p>
          <div id="signedOutPanel" class="auth-grid">
            <form class="auth-card" id="signInForm">
              <h3>Sign in</h3>
              <label>Email<input id="signInEmail" type="email" autocomplete="email" required /></label>
              <label>Password<input id="signInPassword" type="password" autocomplete="current-password" minlength="8" required /></label>
              <button class="button" type="submit">Sign in</button>
            </form>
            <form class="auth-card" id="signUpForm">
              <h3>Create account</h3>
              <label>Name<input id="signUpName" autocomplete="name" required /></label>
              <label>Email<input id="signUpEmail" type="email" autocomplete="email" required /></label>
              <label>Password<input id="signUpPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
              <button class="button" type="submit">Create account</button>
            </form>
            <button class="button google-button" id="googleButton" type="button">Continue with Google</button>
            <form class="auth-card" id="resetRequestForm">
              <h3>Forgot password?</h3>
              <label>Email<input id="resetEmail" type="email" autocomplete="email" required /></label>
              <button class="button secondary" type="submit">Email reset link</button>
            </form>
          </div>
          <form class="auth-card" id="resetPasswordForm" hidden>
            <h3>Choose a new password</h3>
            <label>New password<input id="newPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
            <button class="button" type="submit">Reset password</button>
          </form>
          <div id="signedInPanel" class="account-summary" hidden>
            <strong id="accountName"></strong>
            <span id="accountEmail" class="hint"></span>
            <span id="verificationStatus" class="hint"></span>
            <button class="button secondary" id="resendVerificationButton" type="button">Resend verification email</button>
            <button class="button danger" id="signOutButton" type="button">Sign out</button>
          </div>
          <p class="fine-print">Normal and Air Conditioner stay free. The two $20 unlocks are mocked for now: no card details are requested and no money is charged.</p>
        </div>
      </dialog>

      <dialog id="syncDialog">
        <div class="dialog-body">
          <div class="dialog-head"><h2>Choose which map to keep</h2></div>
          <p>This browser and your account both have a city map. Nothing will be overwritten until you choose.</p>
          <div class="sync-actions">
            <button class="button" id="useAccountMap" type="button">Use account map</button>
            <button class="button secondary" id="useBrowserMap" type="button">Use this browser's map</button>
          </div>
        </div>
      </dialog>

      <dialog id="purchaseDialog">
        <div class="dialog-body">
          <div class="dialog-head">
            <div><p class="eyebrow">Demo store</p><h2 id="purchaseTitle">Mock purchase</h2></div>
            <button class="close-button" data-close-dialog="purchaseDialog" type="button" aria-label="Close">×</button>
          </div>
          <p id="purchaseDescription">Choose a locked feature to start a pretend purchase.</p>
          <div class="button-row">
            <button class="button" id="completeMockPurchase" type="button" hidden>Yes, pretend to purchase</button>
            <button class="button danger" id="refundMockPurchases" type="button" hidden>Refund / reset purchases</button>
          </div>
          <p class="fine-print">Demo unlocks are saved in this browser. When account services are configured, they also follow the signed-in account.</p>
        </div>
      </dialog>
    `
  }

  private bindEvents() {
    this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode as ClimateMode
        if (mode === 'heater' && !this.entitlements.heater) {
          void this.startCheckout('heater')
          return
        }
        this.state.activeMode = mode
        this.persistState()
        this.renderGame()
      })
    })

    this.getElement<HTMLFormElement>('cityForm').addEventListener('submit', event => {
      event.preventDefault()
      this.saveCity()
    })
    this.getElement<HTMLButtonElement>('cancelEditButton').addEventListener('click', () => this.resetCityForm())
    this.getElement<HTMLButtonElement>('clearMapButton').addEventListener('click', () => this.clearMap())
    this.getElement<HTMLDivElement>('map').addEventListener('click', event => this.selectMapPosition(event))
    this.getElement<HTMLFormElement>('connectionForm').addEventListener('submit', event => {
      event.preventDefault()
      this.addConnection()
    })
    this.getElement<HTMLButtonElement>('buyConnectionsButton').addEventListener('click', () => void this.startCheckout('connections'))
    this.getElement<HTMLButtonElement>('purchaseSettingsButton').addEventListener('click', () => this.openPurchaseSettings())
    this.getElement<HTMLButtonElement>('accountButton').addEventListener('click', () => this.openAccountDialog())
    this.root.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach(button => {
      button.addEventListener('click', () => this.getElement<HTMLDialogElement>(button.dataset.closeDialog!).close())
    })

    this.getElement<HTMLFormElement>('signInForm').addEventListener('submit', event => void this.signIn(event))
    this.getElement<HTMLFormElement>('signUpForm').addEventListener('submit', event => void this.signUp(event))
    this.getElement<HTMLButtonElement>('googleButton').addEventListener('click', () => void this.signInWithGoogle())
    this.getElement<HTMLFormElement>('resetRequestForm').addEventListener('submit', event => void this.requestPasswordReset(event))
    this.getElement<HTMLFormElement>('resetPasswordForm').addEventListener('submit', event => void this.resetPassword(event))
    this.getElement<HTMLButtonElement>('resendVerificationButton').addEventListener('click', () => void this.resendVerification())
    this.getElement<HTMLButtonElement>('signOutButton').addEventListener('click', () => void this.signOut())
    this.getElement<HTMLButtonElement>('useAccountMap').addEventListener('click', () => this.resolveMapConflict('account'))
    this.getElement<HTMLButtonElement>('useBrowserMap').addEventListener('click', () => void this.resolveMapConflict('browser'))
    this.getElement<HTMLButtonElement>('completeMockPurchase').addEventListener('click', () => void this.completeMockPurchase())
    this.getElement<HTMLButtonElement>('refundMockPurchases').addEventListener('click', () => void this.refundMockPurchases())
  }

  private async initializeOnlineFeatures() {
    try {
      const response = await fetch('/api/city-temperature/config')
      if (response.ok) this.configuration = await response.json()
    } catch {
      // Guest play remains available offline.
    }

    const resetToken = new URL(window.location.href).searchParams.get('token')
    if (resetToken) {
      this.getElement<HTMLFormElement>('resetPasswordForm').hidden = false
      this.getElement<HTMLDivElement>('signedOutPanel').hidden = true
      this.openAccountDialog('Enter a new password to finish the reset.')
    }

    if (this.configuration.accountsConfigured) {
      await this.refreshSession()
      if (this.session) await this.synchronizeAccountMap()
    }

    this.renderAccount()
    this.renderPaidFeatures()
  }

  private loadLocalState(): MapState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createEmptyMapState()
      const result = validateMapState(JSON.parse(raw))
      if (result.ok && result.state) return result.state
    } catch {
      // Start clean when storage is missing or invalid.
    }
    return createEmptyMapState()
  }

  private loadMockEntitlements(): FeatureEntitlements {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(`${STORAGE_KEY}:mock-entitlements`) || '{}',
      )
      return {
        heater: parsed.heater === true,
        connections: parsed.connections === true,
      }
    } catch {
      return {heater: false, connections: false}
    }
  }

  private saveMockEntitlements() {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}:mock-entitlements`,
        JSON.stringify(this.entitlements),
      )
    } catch {
      // The current session remains unlocked when storage is unavailable.
    }
  }

  private persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      this.setSaveState('Browser storage unavailable')
    }

    if (!this.session) {
      this.setSaveState('Saved in this browser')
      return
    }

    this.setSaveState('Saving to account…')
    if (this.saveTimer) window.clearTimeout(this.saveTimer)
    this.saveTimer = window.setTimeout(() => void this.saveRemoteState(), 650)
  }

  private async saveRemoteState(version = this.remoteVersion) {
    try {
      const response = await fetch('/api/city-temperature/state', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({map: this.state, version}),
      })
      const body = await response.json().catch(() => ({}))

      if (response.status === 409 && body.map) {
        this.conflictState = {map: body.map, version: body.version}
        this.getElement<HTMLDialogElement>('syncDialog').showModal()
        this.setSaveState('Choose which map to keep')
        return
      }
      if (!response.ok) throw new Error(body.error || 'Could not save the map.')

      this.remoteVersion = body.version
      this.setSaveState('Saved to your account')
    } catch (error) {
      this.setSaveState(error instanceof Error ? error.message : 'Account save failed')
    }
  }

  private async fetchRemoteState(): Promise<RemoteStateResponse | null> {
    try {
      const response = await fetch('/api/city-temperature/state')
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  private async synchronizeAccountMap() {
    const remote = await this.fetchRemoteState()
    if (!remote) {
      this.setSaveState('Using browser save; account is unavailable')
      return
    }

    const localEntitlements = this.loadMockEntitlements()
    this.entitlements = {
      heater: remote.entitlements.heater || localEntitlements.heater,
      connections:
        remote.entitlements.connections || localEntitlements.connections,
    }
    if (
      (localEntitlements.heater && !remote.entitlements.heater) ||
      (localEntitlements.connections && !remote.entitlements.connections)
    ) {
      await this.syncMockEntitlements(localEntitlements)
    }
    this.remoteVersion = remote.version
    const localHasMap = mapHasContent(this.state)
    const remoteHasMap = Boolean(remote.map && mapHasContent(remote.map))

    if (!remote.map || !remoteHasMap) {
      if (localHasMap) await this.saveRemoteState(remote.version)
      this.renderGame()
      return
    }

    if (!localHasMap) {
      this.useState(remote.map)
      this.setSaveState('Loaded from your account')
      return
    }

    if (!mapsAreEqual(this.state, remote.map)) {
      this.conflictState = {map: remote.map, version: remote.version}
      this.getElement<HTMLDialogElement>('syncDialog').showModal()
      return
    }

    this.setSaveState('Saved to your account')
    this.renderGame()
  }

  private resolveMapConflict(choice: 'account' | 'browser') {
    if (!this.conflictState) return
    if (choice === 'account') {
      this.remoteVersion = this.conflictState.version
      this.useState(this.conflictState.map)
      this.setSaveState('Loaded from your account')
    } else {
      this.remoteVersion = this.conflictState.version
      void this.saveRemoteState(this.conflictState.version)
    }
    this.conflictState = null
    this.getElement<HTMLDialogElement>('syncDialog').close()
  }

  private useState(state: MapState) {
    this.state = structuredClone(state)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // The in-memory state still works.
    }
    this.renderGame()
  }

  private selectMapPosition(event: MouseEvent) {
    const map = this.getElement<HTMLDivElement>('map')
    if ((event.target as HTMLElement).closest('.city-marker')) return
    const rect = map.getBoundingClientRect()
    this.selectedPosition = {
      x: clampPercentage(((event.clientX - rect.left) / rect.width) * 100),
      y: clampPercentage(((event.clientY - rect.top) / rect.height) * 100),
    }

    if (this.movingCityId) {
      const city = this.state.cities.find(item => item.id === this.movingCityId)
      if (city) city.position = {...this.selectedPosition}
      this.movingCityId = null
      this.setStatus('City moved.', 'success')
      this.persistState()
      this.renderGame()
      return
    }

    this.renderPendingMarker()
  }

  private saveCity() {
    const name = this.getElement<HTMLInputElement>('cityName').value.trim()
    const temperatures: City['temperatures'] = {
      heater: Number(this.getElement<HTMLInputElement>('heaterTemperature').value),
      normal: Number(this.getElement<HTMLInputElement>('normalTemperature').value),
      'air-conditioner': Number(this.getElement<HTMLInputElement>('acTemperature').value),
    }

    if (!name) return this.setStatus('Enter a city name.', 'error')
    if (name.length > 80) return this.setStatus('City names can be at most 80 characters.', 'error')
    for (const temperature of Object.values(temperatures)) {
      if (!Number.isInteger(temperature) || temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
        return this.setStatus(`Use whole temperatures from ${MIN_TEMPERATURE} to ${MAX_TEMPERATURE}.`, 'error')
      }
    }
    if (!temperaturesAreOrdered(temperatures)) {
      return this.setStatus('Heater must be warmer than Normal, and Normal must be warmer than Air Conditioner.', 'error')
    }

    if (this.editingCityId) {
      const city = this.state.cities.find(item => item.id === this.editingCityId)
      if (!city) return
      city.name = name
      city.temperatures = temperatures
      city.position = {...this.selectedPosition}
      this.setStatus(`${name} updated.`, 'success')
    } else {
      if (this.state.cities.length >= MAX_CITIES) return this.setStatus(`A map can have at most ${MAX_CITIES} cities.`, 'error')
      this.state.cities.push({
        id: makeId('city'),
        name,
        temperatures,
        position: {...this.selectedPosition},
      })
      this.setStatus(`${name} added to the map.`, 'success')
    }

    this.persistState()
    this.resetCityForm(false)
    this.renderGame()
  }

  private editCity(cityId: string) {
    const city = this.state.cities.find(item => item.id === cityId)
    if (!city) return
    this.editingCityId = city.id
    this.selectedPosition = {...city.position}
    this.getElement<HTMLInputElement>('cityName').value = city.name
    this.getElement<HTMLInputElement>('heaterTemperature').value = String(city.temperatures.heater)
    this.getElement<HTMLInputElement>('normalTemperature').value = String(city.temperatures.normal)
    this.getElement<HTMLInputElement>('acTemperature').value = String(city.temperatures['air-conditioner'])
    this.getElement<HTMLElement>('cityFormTitle').textContent = 'Edit city'
    this.getElement<HTMLButtonElement>('saveCityButton').textContent = 'Save changes'
    this.getElement<HTMLButtonElement>('cancelEditButton').hidden = false
    this.renderPendingMarker()
    this.getElement<HTMLInputElement>('cityName').focus()
  }

  private resetCityForm(clearStatus = true) {
    this.editingCityId = null
    this.getElement<HTMLFormElement>('cityForm').reset()
    this.getElement<HTMLInputElement>('heaterTemperature').value = String(DEFAULT_TEMPERATURES.heater)
    this.getElement<HTMLInputElement>('normalTemperature').value = String(DEFAULT_TEMPERATURES.normal)
    this.getElement<HTMLInputElement>('acTemperature').value = String(DEFAULT_TEMPERATURES['air-conditioner'])
    this.getElement<HTMLElement>('cityFormTitle').textContent = 'Add a city'
    this.getElement<HTMLButtonElement>('saveCityButton').textContent = 'Add city'
    this.getElement<HTMLButtonElement>('cancelEditButton').hidden = true
    if (clearStatus) this.setStatus('')
    this.renderPendingMarker()
  }

  private moveCity(cityId: string) {
    const city = this.state.cities.find(item => item.id === cityId)
    if (!city) return
    this.movingCityId = cityId
    this.getElement<HTMLElement>('mapHint').textContent = `Click a new map position for ${city.name}.`
    this.setStatus(`Choose a new spot for ${city.name}.`)
  }

  private removeCity(cityId: string) {
    const city = this.state.cities.find(item => item.id === cityId)
    if (!city || !window.confirm(`Remove ${city.name}?`)) return
    this.state.cities = this.state.cities.filter(item => item.id !== cityId)
    this.state.connections = this.state.connections.filter(
      connection => connection.fromCityId !== cityId && connection.toCityId !== cityId,
    )
    if (this.editingCityId === cityId) this.resetCityForm()
    this.persistState()
    this.renderGame()
  }

  private clearMap() {
    if (!mapHasContent(this.state) || !window.confirm('Clear every city and connection from this map?')) return
    this.state.cities = []
    this.state.connections = []
    this.state.activeMode = 'normal'
    this.resetCityForm()
    this.persistState()
    this.renderGame()
  }

  private addConnection() {
    if (!this.entitlements.connections) return void this.startCheckout('connections')
    const fromCityId = this.getElement<HTMLSelectElement>('fromCity').value
    const toCityId = this.getElement<HTMLSelectElement>('toCity').value
    if (!fromCityId || !toCityId) return this.setStatus('Choose two cities to connect.', 'error')
    if (fromCityId === toCityId) return this.setStatus('A city cannot connect to itself.', 'error')
    const pair = [fromCityId, toCityId].sort().join(':')
    const duplicate = this.state.connections.some(
      connection => [connection.fromCityId, connection.toCityId].sort().join(':') === pair,
    )
    if (duplicate) return this.setStatus('Those cities are already connected.', 'error')

    this.state.connections.push({id: makeId('connection'), fromCityId, toCityId})
    this.persistState()
    this.setStatus('Connection added.', 'success')
    this.renderGame()
  }

  private removeConnection(connectionId: string) {
    this.state.connections = this.state.connections.filter(connection => connection.id !== connectionId)
    this.persistState()
    this.renderGame()
  }

  private renderGame() {
    this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === this.state.activeMode))
    })
    this.renderPendingMarker()
    this.renderMap()
    this.renderCityList()
    this.renderCitySelectors()
    this.renderConnectionList()
    this.renderPaidFeatures()
  }

  private renderPendingMarker() {
    const marker = this.getElement<HTMLElement>('pendingMarker')
    marker.style.left = `${this.selectedPosition.x}%`
    marker.style.top = `${this.selectedPosition.y}%`
    marker.hidden = Boolean(this.movingCityId)
    this.getElement<HTMLElement>('positionReadout').textContent =
      `Map position: ${this.selectedPosition.x.toFixed(1)}%, ${this.selectedPosition.y.toFixed(1)}%`
  }

  private renderMap() {
    const layer = this.getElement<HTMLDivElement>('markerLayer')
    layer.replaceChildren()
    const mode = this.state.activeMode
    this.state.cities.forEach(city => {
      const temperature = getCityTemperature(city, mode)
      const presentation = getTemperaturePresentation(temperature)
      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = 'city-marker'
      marker.style.left = `${city.position.x}%`
      marker.style.top = `${city.position.y}%`
      marker.style.color = presentation.color
      marker.title = `${city.name}: ${temperature}°F. Click to edit.`
      marker.append(document.createTextNode(`${city.name} ${temperature}°`))
      if (presentation.fireOpacity > 0) {
        const fire = document.createElement('span')
        fire.className = 'fire'
        fire.textContent = '🔥'
        fire.style.opacity = String(presentation.fireOpacity)
        fire.setAttribute('aria-label', 'extreme heat')
        marker.append(fire)
      }
      marker.addEventListener('click', event => {
        event.stopPropagation()
        this.editCity(city.id)
      })
      layer.append(marker)
    })
    this.getElement<HTMLElement>('mapHint').textContent = this.movingCityId
      ? this.getElement<HTMLElement>('mapHint').textContent
      : 'Click anywhere to place the next city.'
    requestAnimationFrame(() => this.drawConnections())
  }

  private drawConnections() {
    const canvas = this.getElement<SVGSVGElement>('connectionCanvas')
    const map = this.getElement<HTMLElement>('map')
    const width = map.clientWidth
    const height = map.clientHeight
    canvas.setAttribute('viewBox', `0 0 ${width} ${height}`)
    canvas.replaceChildren()
    if (!this.entitlements.connections) return

    this.state.connections.forEach(connection => {
      const from = this.state.cities.find(city => city.id === connection.fromCityId)
      const to = this.state.cities.find(city => city.id === connection.toCityId)
      if (!from || !to) return
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', String((from.position.x / 100) * width))
      line.setAttribute('y1', String((from.position.y / 100) * height))
      line.setAttribute('x2', String((to.position.x / 100) * width))
      line.setAttribute('y2', String((to.position.y / 100) * height))
      line.setAttribute('stroke', '#0e7490')
      line.setAttribute('stroke-width', '3')
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke-dasharray', '9 7')
      line.setAttribute('opacity', '.58')
      canvas.append(line)
    })
  }

  private renderCityList() {
    const list = this.getElement<HTMLDivElement>('cityList')
    list.replaceChildren()
    if (this.state.cities.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty'
      empty.textContent = 'No cities yet. Pick a map position and add one.'
      list.append(empty)
      return
    }

    this.state.cities.forEach(city => {
      const activeTemperature = city.temperatures[this.state.activeMode]
      const presentation = getTemperaturePresentation(activeTemperature)
      const card = document.createElement('article')
      card.className = 'city-card'

      const head = document.createElement('div')
      head.className = 'city-card-head'
      const swatch = document.createElement('span')
      swatch.className = 'swatch'
      swatch.style.background = presentation.color
      const title = document.createElement('span')
      title.className = 'city-title'
      title.textContent = city.name
      const value = document.createElement('span')
      value.className = 'active-temperature'
      value.textContent = `${activeTemperature}°`
      if (presentation.fireOpacity > 0) {
        const fire = document.createElement('span')
        fire.className = 'fire'
        fire.textContent = '🔥'
        fire.style.opacity = String(presentation.fireOpacity)
        value.append(fire)
      }
      head.append(swatch, title, value)

      const values = document.createElement('div')
      values.className = 'temperatures'
      ;([
        ['🔥 Heater', city.temperatures.heater],
        ['Normal', city.temperatures.normal],
        ['❄️ AC', city.temperatures['air-conditioner']],
      ] as const).forEach(([label, temperature]) => {
        const pill = document.createElement('span')
        pill.className = 'temperature-pill'
        pill.textContent = `${label}: ${temperature}°`
        values.append(pill)
      })

      const actions = document.createElement('div')
      actions.className = 'card-actions'
      const edit = this.makeSmallButton('Edit', () => this.editCity(city.id))
      const move = this.makeSmallButton('Move', () => this.moveCity(city.id))
      const remove = this.makeSmallButton('Remove', () => this.removeCity(city.id), true)
      actions.append(edit, move, remove)
      card.append(head, values, actions)
      list.append(card)
    })
  }

  private makeSmallButton(label: string, action: () => void, danger = false): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `small-button${danger ? ' danger' : ''}`
    button.textContent = label
    button.addEventListener('click', action)
    return button
  }

  private renderCitySelectors() {
    const from = this.getElement<HTMLSelectElement>('fromCity')
    const to = this.getElement<HTMLSelectElement>('toCity')
    const previousFrom = from.value
    const previousTo = to.value
    from.replaceChildren(new Option('Choose city…', ''))
    to.replaceChildren(new Option('Choose city…', ''))
    this.state.cities.forEach(city => {
      from.add(new Option(city.name, city.id))
      to.add(new Option(city.name, city.id))
    })
    if (this.state.cities.some(city => city.id === previousFrom)) from.value = previousFrom
    if (this.state.cities.some(city => city.id === previousTo)) to.value = previousTo
  }

  private renderConnectionList() {
    const list = this.getElement<HTMLDivElement>('connectionList')
    list.replaceChildren()
    if (!this.entitlements.connections || this.state.connections.length === 0) return
    this.state.connections.forEach(connection => {
      const from = this.state.cities.find(city => city.id === connection.fromCityId)
      const to = this.state.cities.find(city => city.id === connection.toCityId)
      if (!from || !to) return
      const card = document.createElement('div')
      card.className = 'connection-card city-card-head'
      const title = document.createElement('span')
      title.className = 'city-title'
      title.textContent = `${from.name} ↔ ${to.name}`
      card.append(title, this.makeSmallButton('Remove', () => this.removeConnection(connection.id), true))
      list.append(card)
    })
  }

  private renderPaidFeatures() {
    const heaterPrice = this.getElement<HTMLElement>('heaterPrice')
    heaterPrice.className = this.entitlements.heater ? 'owned-badge' : 'lock-badge'
    heaterPrice.textContent = this.entitlements.heater ? 'Purchased ✓' : '🔒 $20 demo'
    const connectionsPrice = this.getElement<HTMLElement>('connectionsPrice')
    connectionsPrice.className = this.entitlements.connections ? 'owned-badge' : 'lock-badge'
    connectionsPrice.textContent = this.entitlements.connections ? 'Purchased ✓' : '🔒 $20 demo'
    this.getElement<HTMLButtonElement>('purchaseSettingsButton').textContent =
      this.entitlements.heater || this.entitlements.connections
        ? 'Purchases ✓'
        : 'Pretend purchases'
    this.getElement<HTMLElement>('connectionLock').hidden = this.entitlements.connections
    this.getElement<HTMLFormElement>('connectionForm').hidden = !this.entitlements.connections
    this.drawConnections()
  }

  private async refreshSession() {
    try {
      const result = await authClient.getSession({query: {}})
      this.session = result.data
    } catch {
      this.session = null
    }
    this.renderAccount()
  }

  private renderAccount() {
    const signedIn = Boolean(this.session?.user)
    this.getElement<HTMLDivElement>('signedOutPanel').hidden = signedIn
    this.getElement<HTMLDivElement>('signedInPanel').hidden = !signedIn
    this.getElement<HTMLButtonElement>('googleButton').hidden = !this.configuration.googleEnabled
    this.getElement<HTMLButtonElement>('accountButton').textContent = signedIn
      ? this.session.user.name || 'Account'
      : 'Account'

    if (!this.configuration.accountsConfigured) {
      this.getElement<HTMLElement>('accountMessage').textContent =
        'Account services are not configured yet. Guest play and browser saving are available.'
      this.getElement<HTMLDivElement>('signedOutPanel').hidden = true
      return
    }

    if (signedIn) {
      this.getElement<HTMLElement>('accountMessage').textContent = 'Your map and demo unlocks follow this account.'
      this.getElement<HTMLElement>('accountName').textContent = this.session.user.name || 'Player'
      this.getElement<HTMLElement>('accountEmail').textContent = this.session.user.email
      this.getElement<HTMLElement>('verificationStatus').textContent = this.session.user.emailVerified
        ? 'Email verified'
        : 'Verify your email to finish setting up account saving.'
      this.getElement<HTMLButtonElement>('resendVerificationButton').hidden = Boolean(this.session.user.emailVerified)
    } else {
      this.getElement<HTMLElement>('accountMessage').textContent =
        'Sign in to save across devices and sync demo unlocks.'
    }
  }

  private openAccountDialog(message?: string) {
    if (message) this.getElement<HTMLElement>('accountMessage').textContent = message
    const dialog = this.getElement<HTMLDialogElement>('accountDialog')
    if (!dialog.open) dialog.showModal()
  }

  private async signIn(event: SubmitEvent) {
    event.preventDefault()
    const email = this.getElement<HTMLInputElement>('signInEmail').value
    const password = this.getElement<HTMLInputElement>('signInPassword').value
    const result = await authClient.signIn.email({email, password, callbackURL: '/city-temperature'})
    if (result.error) return this.openAccountDialog(result.error.message || 'Sign in failed.')
    await this.refreshSession()
    await this.synchronizeAccountMap()
    this.openAccountDialog('Signed in successfully.')
  }

  private async signUp(event: SubmitEvent) {
    event.preventDefault()
    const name = this.getElement<HTMLInputElement>('signUpName').value
    const email = this.getElement<HTMLInputElement>('signUpEmail').value
    const password = this.getElement<HTMLInputElement>('signUpPassword').value
    const result = await authClient.signUp.email({name, email, password, callbackURL: '/city-temperature'})
    if (result.error) return this.openAccountDialog(result.error.message || 'Account creation failed.')
    this.openAccountDialog('Account created. Check your email to verify it, then sign in.')
  }

  private async signInWithGoogle() {
    await authClient.signIn.social({provider: 'google', callbackURL: '/city-temperature'})
  }

  private async requestPasswordReset(event: SubmitEvent) {
    event.preventDefault()
    const email = this.getElement<HTMLInputElement>('resetEmail').value
    const result = await authClient.requestPasswordReset({email, redirectTo: '/city-temperature'})
    this.openAccountDialog(result.error ? result.error.message : 'If that account exists, a reset link has been sent.')
  }

  private async resetPassword(event: SubmitEvent) {
    event.preventDefault()
    const token = new URL(window.location.href).searchParams.get('token') || undefined
    const newPassword = this.getElement<HTMLInputElement>('newPassword').value
    const result = await authClient.resetPassword({newPassword, token})
    if (result.error) return this.openAccountDialog(result.error.message || 'Password reset failed.')
    const url = new URL(window.location.href)
    url.searchParams.delete('token')
    history.replaceState({}, '', url)
    this.getElement<HTMLFormElement>('resetPasswordForm').hidden = true
    this.getElement<HTMLDivElement>('signedOutPanel').hidden = false
    this.openAccountDialog('Password reset. You can sign in now.')
  }

  private async resendVerification() {
    if (!this.session?.user?.email) return
    const result = await authClient.sendVerificationEmail({
      email: this.session.user.email,
      callbackURL: '/city-temperature',
    })
    this.openAccountDialog(result.error ? result.error.message : 'Verification email sent.')
  }

  private async signOut() {
    await authClient.signOut({})
    this.session = null
    this.entitlements = this.loadMockEntitlements()
    if (this.state.activeMode === 'heater') this.state.activeMode = 'normal'
    this.renderAccount()
    this.renderGame()
    this.setSaveState('Saved in this browser')
    this.getElement<HTMLDialogElement>('accountDialog').close()
  }

  private startCheckout(feature: PaidFeature) {
    this.pendingMockFeature = feature
    const name = feature === 'heater' ? 'Heater 🔥' : 'Connect Lines'
    this.getElement<HTMLElement>('purchaseTitle').textContent = `${name} — pretend $20 purchase`
    this.getElement<HTMLElement>('purchaseDescription').textContent =
      `This pretend checkout will automatically charge your father's credit card $20 for ${name}. Are you sure? This is only a game: no real card is accessed and no money is charged.`
    this.getElement<HTMLButtonElement>('completeMockPurchase').hidden = false
    this.getElement<HTMLButtonElement>('refundMockPurchases').hidden =
      !this.entitlements.heater && !this.entitlements.connections
    const dialog = this.getElement<HTMLDialogElement>('purchaseDialog')
    if (!dialog.open) dialog.showModal()
  }

  private openPurchaseSettings() {
    this.pendingMockFeature = null
    const purchased = [
      this.entitlements.heater ? 'Heater' : '',
      this.entitlements.connections ? 'Connect Lines' : '',
    ].filter(Boolean)
    this.getElement<HTMLElement>('purchaseTitle').textContent = 'Pretend purchases'
    this.getElement<HTMLElement>('purchaseDescription').textContent = purchased.length
      ? `Purchased in the game: ${purchased.join(' and ')}. These are pretend purchases; no money was charged.`
      : 'Nothing is purchased yet. Select Heater or Connect Lines to try the pretend $20 checkout.'
    this.getElement<HTMLButtonElement>('completeMockPurchase').hidden = true
    this.getElement<HTMLButtonElement>('refundMockPurchases').hidden = purchased.length === 0
    const dialog = this.getElement<HTMLDialogElement>('purchaseDialog')
    if (!dialog.open) dialog.showModal()
  }

  private async completeMockPurchase() {
    const feature = this.pendingMockFeature
    if (!feature) return
    this.entitlements[feature] = true
    this.saveMockEntitlements()

    if (this.session) {
      try {
        const response = await fetch('/api/city-temperature/mock-purchase', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({feature}),
        })
        const body = await response.json().catch(() => ({}))
        if (response.ok && body.entitlements) {
          this.entitlements = body.entitlements
          this.saveMockEntitlements()
        }
      } catch {
        // The browser unlock still works when account syncing is offline.
      }
    }

    this.pendingMockFeature = null
    if (feature === 'heater') this.state.activeMode = 'heater'
    this.getElement<HTMLDialogElement>('purchaseDialog').close()
    this.setStatus(
      `${feature === 'heater' ? 'Heater' : 'Connect Lines'} purchased in the game. No money was charged.`,
      'success',
    )
    this.renderGame()
    this.persistState()
  }

  private async refundMockPurchases() {
    if (
      !window.confirm(
        'Refund and reset both pretend purchases? Heater will return to Normal and saved connection lines will be removed.',
      )
    ) return

    this.entitlements = {heater: false, connections: false}
    this.saveMockEntitlements()
    if (this.state.activeMode === 'heater') this.state.activeMode = 'normal'
    this.state.connections = []

    if (this.session) {
      try {
        await fetch('/api/city-temperature/mock-purchase', {method: 'DELETE'})
      } catch {
        // The local reset still succeeds when account syncing is offline.
      }
    }

    this.pendingMockFeature = null
    this.getElement<HTMLDialogElement>('purchaseDialog').close()
    this.persistState()
    this.renderGame()
    this.setStatus('Pretend purchases refunded and reset. No real money changed hands.', 'success')
  }

  private async syncMockEntitlements(
    entitlements: FeatureEntitlements,
  ): Promise<void> {
    for (const feature of ['heater', 'connections'] as const) {
      if (!entitlements[feature]) continue
      try {
        await fetch('/api/city-temperature/mock-purchase', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({feature}),
        })
      } catch {
        // Retry on the next sign in.
      }
    }
  }

  private setStatus(message: string, kind: '' | 'error' | 'success' = '') {
    const status = this.getElement<HTMLElement>('status')
    status.textContent = message
    status.className = `status${kind ? ` ${kind}` : ''}`
  }

  private setSaveState(message: string) {
    this.getElement<HTMLElement>('saveState').textContent = message
  }
}

if (typeof window !== 'undefined' && !customElements.get('city-temperature-game')) {
  customElements.define('city-temperature-game', CityTemperatureGame)
}
