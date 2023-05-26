import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
// import { presetWind, presetUno, presetAttributify, presetIcons, presetMini, presetTagify, presetTypography } from 'unocss'

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [UnoCSS({
    injectReset: true
    // presets: [
    //     presetWind(),
    //     presetUno(),
    //     presetAttributify(),
    //     presetIcons(),
    //     presetMini(),
    //     presetTagify(),
    //     presetTypography()
    // ]
  }), react()]
});

// from their sample
// import { defineConfig } from 'astro/config'
// import UnoCSS from 'unocss/astro'

// export default defineConfig({
//   integrations: [
//     UnoCSS({ injectReset: true }),
//   ],
// })