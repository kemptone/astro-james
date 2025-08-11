const IS_BROWSER = typeof window !== 'undefined';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; font-family: system-ui, sans-serif; }
    .wrap { display: grid; gap: 1rem; grid-template-columns: 320px 1fr; align-items: start; }
    fieldset { border: 1px solid #ccc; border-radius: 8px; padding: 0.75rem 1rem; }
    legend { padding: 0 0.25rem; font-weight: 600; }
    label { display: grid; grid-template-columns: 120px 1fr; align-items: center; margin: 0.25rem 0; gap: 0.5rem; }
    input[type="number"] { width: 100%; padding: 0.4rem 0.5rem; border: 1px solid #bbb; border-radius: 6px; }
    select { padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid #bbb; }
    button { padding: 0.5rem 0.75rem; border: 0; border-radius: 8px; background: #2563eb; color: white; font-weight: 600; cursor: pointer; }
    button[disabled] { background: #9ca3af; cursor: not-allowed; }

    .scene { background: linear-gradient(#eef6ff, #ffffff); border: 1px solid #dbeafe; border-radius: 12px; min-height: 320px; position: relative; overflow: hidden; }
    svg { width: 100%; height: 100%; display: block; }

    .note { font-size: 12px; color: #6b7280; }
  </style>
  <div class="wrap">
    <fieldset>
      <legend>Valves</legend>
      <label>
        <span>Sprinklers (0 on / 100 off)</span>
        <input id="spr" type="number" min="0" max="100" step="1" value="0" />
      </label>
      <label>
        <span>House (0 on / 100 off)</span>
        <input id="house" type="number" min="0" max="100" step="1" value="0" />
      </label>
      <label>
        <span>Backyard (optional)</span>
        <input id="back" type="number" min="0" max="100" step="1" placeholder="" />
      </label>
      <label>
        <span>Location</span>
        <select id="loc">
          <option value="backyard">Backyard</option>
          <option value="inside">Inside</option>
          <option value="frontyard">Frontyard</option>
        </select>
      </label>
      <div class="note">Only works in Backyard or Inside. Frontyard disables Submit.</div>
      <div style="display:flex; gap:.5rem; margin-top:.75rem; align-items:center;">
        <button id="toggle-grass" type="button">Toggle Grass Sprinklers</button>
        <button id="toggle-trees" type="button">Toggle Trees</button>
        <button id="submit" type="button">Submit</button>
      </div>
    </fieldset>
    <div class="scene">
      <svg id="svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-label="Water scene">
        <defs>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
          <filter id="froth" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="noise"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.8 0"/>
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="0.6"/>
          </filter>
        </defs>
        <rect x="0" y="300" width="800" height="100" fill="#86efac"/>
        <rect x="520" y="210" width="140" height="90" rx="8" fill="#9ca3af"/>
        <rect x="100" y="230" width="60" height="40" rx="6" fill="#6b7280"/>
        <circle id="faucetStream" cx="130" cy="270" r="0" fill="url(#waterGrad)" filter="url(#froth)"/>
        <g id="sprinklers">
          <rect x="260" y="270" width="8" height="30" fill="#4b5563"/>
          <rect x="330" y="270" width="8" height="30" fill="#4b5563"/>
          <rect x="400" y="270" width="8" height="30" fill="#4b5563"/>
          <path id="spray1" d="M264 270 C 300 250, 300 250, 330 270" stroke="#60a5fa" stroke-width="0" fill="none"/>
          <path id="spray2" d="M334 270 C 370 250, 370 250, 400 270" stroke="#60a5fa" stroke-width="0" fill="none"/>
          <path id="spray3" d="M404 270 C 440 250, 440 250, 470 270" stroke="#60a5fa" stroke-width="0" fill="none"/>
        </g>
        <g id="trees">
          <rect x="600" y="210" width="8" height="40" fill="#166534"/>
          <circle cx="604" cy="200" r="24" fill="#16a34a"/>
          <path id="treeSpray" d="M604 250 q 10 30 0 60" stroke="#60a5fa" stroke-width="0" fill="none"/>
        </g>
      </svg>
    </div>
  </div>
`;

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

class WCValves extends HTMLElement {
  private els!: {
    spr: HTMLInputElement;
    house: HTMLInputElement;
    back: HTMLInputElement;
    loc: HTMLSelectElement;
    submit: HTMLButtonElement;
    toggleGrass: HTMLButtonElement;
    toggleTrees: HTMLButtonElement;
    svg: SVGSVGElement;
    faucetStream: SVGCircleElement;
    spray1: SVGPathElement; spray2: SVGPathElement; spray3: SVGPathElement; treeSpray: SVGPathElement;
  };
  private raf = 0;
  private t = 0;
  private state = { grassOn: true, treesOn: false };

  constructor() { super(); }

  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));
    this.els = {
      spr: root.querySelector('#spr') as HTMLInputElement,
      house: root.querySelector('#house') as HTMLInputElement,
      back: root.querySelector('#back') as HTMLInputElement,
      loc: root.querySelector('#loc') as HTMLSelectElement,
      submit: root.querySelector('#submit') as HTMLButtonElement,
      toggleGrass: root.querySelector('#toggle-grass') as HTMLButtonElement,
      toggleTrees: root.querySelector('#toggle-trees') as HTMLButtonElement,
      svg: root.querySelector('#svg') as SVGSVGElement,
      faucetStream: root.querySelector('#faucetStream') as SVGCircleElement,
      spray1: root.querySelector('#spray1') as SVGPathElement,
      spray2: root.querySelector('#spray2') as SVGPathElement,
      spray3: root.querySelector('#spray3') as SVGPathElement,
      treeSpray: root.querySelector('#treeSpray') as SVGPathElement,
    };

    const onChange = () => this.updateEnabled();
    ['input','change'].forEach(evt => {
      this.els.spr.addEventListener(evt, onChange);
      this.els.house.addEventListener(evt, onChange);
      this.els.back.addEventListener(evt, onChange);
      this.els.loc.addEventListener(evt, onChange);
    });
    this.els.submit.addEventListener('click', () => this.onSubmit());
    this.els.toggleGrass.addEventListener('click', () => { this.state.grassOn = !this.state.grassOn; });
    this.els.toggleTrees.addEventListener('click', () => { this.state.treesOn = !this.state.treesOn; });

    this.updateEnabled();
    this.loop();
  }

  disconnectedCallback() { cancelAnimationFrame(this.raf); }

  private getFlows() {
    const spr = Number(this.els.spr.value || 0);
    const house = Number(this.els.house.value || 0);
    const backRaw = this.els.back.value === '' ? undefined : Number(this.els.back.value);
    const loc = this.els.loc.value as 'backyard' | 'inside' | 'frontyard';

    const fSpr = clamp01(1 - spr / 100);
    const fHouse = clamp01(1 - house / 100);
    const fBack = backRaw === undefined ? 1 : clamp01(1 - (backRaw as number) / 100);

    return { fSpr, fHouse, fBack, loc };
  }

  private updateEnabled() {
    const { loc } = this.getFlows();
    const allow = loc === 'backyard' || loc === 'inside';
    this.els.submit.disabled = !allow;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.t += 0.016;

    const { fSpr, fHouse, fBack } = this.getFlows();

    const flowFaucet = fHouse * fBack; // faucet represents indoor water
    const faucetR = 0 + 18 * flowFaucet;
    this.els.faucetStream.setAttribute('r', faucetR.toFixed(2));

    const grassFlow = (this.state.grassOn ? 1 : 0) * fSpr * fBack;
    const w = 2 + 5 * grassFlow * (1 + 0.3 * Math.sin(this.t * 6));
    this.els.spray1.setAttribute('stroke-width', w.toFixed(2));
    this.els.spray2.setAttribute('stroke-width', (w * 0.95).toFixed(2));
    this.els.spray3.setAttribute('stroke-width', (w * 0.9).toFixed(2));

    const treeFlow = (this.state.treesOn ? 1 : 0) * fSpr * fBack;
    const tw = 1 + 6 * treeFlow * (1 + 0.25 * Math.cos(this.t * 5));
    this.els.treeSpray.setAttribute('stroke-width', tw.toFixed(2));
  };

  private onSubmit() {
    const { fSpr, fHouse, fBack, loc } = this.getFlows();
    if (loc === 'frontyard') return;
    const payload = {
      sprinklers: Number(this.els.spr.value || 0),
      house: Number(this.els.house.value || 0),
      backyard: this.els.back.value === '' ? null : Number(this.els.back.value),
      flows: { fSpr, fHouse, fBack },
      toggles: { grass: this.state.grassOn, trees: this.state.treesOn },
      ts: Date.now(),
    } as const;
    this.dispatchEvent(new CustomEvent('valves:submit', { detail: payload, bubbles: true, composed: true }));
    try { console.log('[wc-valves] submit', payload); } catch {}
  }
}

if (IS_BROWSER && !customElements.get('wc-valves')) {
  customElements.define('wc-valves', WCValves);
}

export {};
