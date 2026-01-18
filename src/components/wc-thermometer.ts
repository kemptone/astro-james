if (typeof window !== 'undefined') {
  customElements.define('wc-thermometer', class extends HTMLElement {
    private temperature: number = 20;
    private minTemp: number = -20;
    private maxTemp: number = 50;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const temp = this.getAttribute('temperature');
      if (temp) {
        this.temperature = parseFloat(temp);
      }
      this.render();
    }

    static get observedAttributes() {
      return ['temperature'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (name === 'temperature' && oldValue !== newValue) {
        this.temperature = parseFloat(newValue);
        this.render();
      }
    }

    setTemperature(temp: number) {
      this.temperature = Math.max(this.minTemp, Math.min(this.maxTemp, temp));
      this.setAttribute('temperature', this.temperature.toString());
    }

    private calculateMercuryHeight(): number {
      // Map temperature to percentage (0-100)
      const range = this.maxTemp - this.minTemp;
      const tempOffset = this.temperature - this.minTemp;
      return (tempOffset / range) * 100;
    }

    private getMercuryColor(): string {
      if (this.temperature < 0) return '#0066ff';
      if (this.temperature < 10) return '#00aaff';
      if (this.temperature < 20) return '#ffaa00';
      if (this.temperature < 30) return '#ff6600';
      return '#ff0000';
    }

    render() {
      if (!this.shadowRoot) return;

      const heightPercent = this.calculateMercuryHeight();
      const color = this.getMercuryColor();

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            width: 300px;
            height: auto;
          }
          .container {
            position: relative;
            width: 100%;
            height: auto;
          }
          svg {
            width: 100%;
            height: auto;
            display: block;
          }
          .mercury {
            transition: height 0.5s ease, fill 0.5s ease;
          }
          .temperature-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
          }
        </style>
        <div class="container">
          <svg viewBox="226 93 292 832" preserveAspectRatio="xMidYMid meet">
            <!-- Background thermometer -->
            <rect
              style="fill:#ffffff;stroke:#000000;stroke-width:5;"
              width="285.9653"
              height="825.72479"
              x="229.06459"
              y="96.165672"
              ry="49.999996"
              rx="50" />

            <!-- Gray background column -->
            <path
              style="fill:#f2f2f2;fill-opacity:1;stroke:none"
              d="m 373.56287,164.54744 c 0.30163,-0.0121 -0.2236,-0.15092 -1.90625,1.5 -1.41427,1.3876 -3.34856,4.13828 -5.375,7.65625 l 0,535.91697 c 0.004,4.58042 -3.56553,8.91087 -8.0625,9.78125 -32.9249,6.32523 -57.65625,34.63976 -57.65625,68.71875 0,38.7064 31.81286,70.0625 71.5,70.0625 39.68714,0 71.46875,-31.3514 71.46875,-70.0625 0,-33.20927 -23.46988,-60.96258 -55.125,-68.21875 -4.34251,-1.00069 -7.71326,-5.23118 -7.71875,-9.6875 l 0,-536.54197 c -2.18944,-3.82345 -4.2399,-6.65749 -5.625,-7.9375 -1.63058,-1.50687 -1.80154,-1.17539 -1.5,-1.1875 z" />

            <!-- Clip path for mercury -->
            <defs>
              <clipPath id="mercury-clip">
                <path d="m 373.56287,164.54744 c 0.30163,-0.0121 -0.2236,-0.15092 -1.90625,1.5 -1.41427,1.3876 -3.34856,4.13828 -5.375,7.65625 l 0,535.91697 c 0.004,4.58042 -3.56553,8.91087 -8.0625,9.78125 -32.9249,6.32523 -57.65625,34.63976 -57.65625,68.71875 0,38.7064 31.81286,70.0625 71.5,70.0625 39.68714,0 71.46875,-31.3514 71.46875,-70.0625 0,-33.20927 -23.46988,-60.96258 -55.125,-68.21875 -4.34251,-1.00069 -7.71326,-5.23118 -7.71875,-9.6875 l 0,-536.54197 c -2.18944,-3.82345 -4.2399,-6.65749 -5.625,-7.9375 -1.63058,-1.50687 -1.80154,-1.17539 -1.5,-1.1875 z" />
              </clipPath>
            </defs>

            <!-- Mercury fill (dynamically sized) -->
            <rect
              class="mercury"
              x="300"
              y="${858 - (heightPercent * 6.94)}"
              width="145"
              height="${heightPercent * 6.94}"
              fill="${color}"
              clip-path="url(#mercury-clip)" />

            <!-- Black outline thermometer -->
            <path
              style="fill:none;stroke:#000000;stroke-width:3"
              d="m 373.15662,151.80816 c -5.70979,0.22926 -11.30239,5.89943 -16.8125,16.3125 l 0,541.5 c -37.4511,7.19476 -65.71875,39.59937 -65.71875,78.5 0,44.18278 36.46574,80 81.4375,80 44.97176,0 81.40625,-35.81722 81.40625,-80 0,-37.9046 -26.82231,-69.64921 -62.84375,-77.90625 l 0,-542.09375 c -5.93644,-11.33009 -11.75896,-16.54176 -17.46875,-16.3125 z" />

            <!-- Temperature marks (left side) -->
            <g transform="translate(-0.8328417,-92.938726)">
              ${this.generateMarks(-144.4074)}
            </g>

            <!-- Temperature marks (right side) -->
            <g transform="translate(-0.8328417,-92.938726)">
              ${this.generateMarks(-10.361161)}
            </g>
          </svg>
          <div class="temperature-label">${this.temperature.toFixed(1)}°C</div>
        </div>
      `;
    }

    private generateMarks(xOffset: number): string {
      const marks = [];
      const yPositions = [
        141.70863, 168.62004, 195.53146, 222.44287, 249.35429,
        276.26572, 303.17712, 330.08853, 356.99994, 383.91138,
        410.82278, 437.73419, 464.6456, 491.55701, 518.46844,
        545.37982, 572.29126, 599.2027, 626.11407, 653.02551
      ];

      for (let i = 0; i < yPositions.length; i++) {
        marks.push(`
          <rect
            style="fill:#000000;stroke:#000000;stroke-width:0.69974184px;"
            width="${i % 5 === 0 ? 54.4 : 26.668968}"
            height="4.4852357"
            x="${207.13235 + xOffset * (i % 5 === 0 ? 0.5 : 1)}"
            y="${yPositions[i] + 126.5714}"
            transform="matrix(2.0423224,0,0,1,${xOffset},0)" />
        `);
      }

      return marks.join('');
    }
  });
}
