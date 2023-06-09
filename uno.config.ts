import {
  defineConfig,
  presetIcons,
  presetUno,
  presetAttributify,
  transformerVariantGroup,
  // transformerCompileClass, // DOES NOT WORK WELL WITH ASTRO, for some unknown reason
  // transformerDirectives // cool, but we don't need it
} from 'unocss'

export default defineConfig({
  // shortcuts: [
  //   { 'i-logo': 'i-logos-astro w-6em h-6em transform transition-800' }
  // ],
  transformers: [
    // transformerDirectives(),
    transformerVariantGroup(),
    // transformerCompileClass(),
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    // presetIcons({
    //   extraProperties: {
    //     display: 'inline-block',
    //     'vertical-align': 'middle'
    //   }
    // })
  ]
})

// From their own Docs directory

/*

  // eslint-disable-next-line no-restricted-imports
import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
})

*/
