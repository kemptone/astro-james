import { defineConfig } from 'astro/config';
// import UnoCSS from 'unocss/astro';
// import Deno from '@astrojs/deno'
// import { presetWind, presetUno, presetAttributify, presetIcons, presetMini, presetTagify, presetTypography } from 'unocss'
// import react from "@astrojs/react";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  // adapters: [Deno()],
  integrations: [
  //   UnoCSS({
  //   injectReset: true
  // }), 
  // react(), 
  preact(),
]
});

// from their sample
// import { defineConfig } from 'astro/config'
// import UnoCSS from 'unocss/astro'

// export default defineConfig({
//   integrations: [
//     UnoCSS({ injectReset: true }),
//   ],
// })