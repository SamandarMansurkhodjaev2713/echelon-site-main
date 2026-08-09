// @ts-check
import { defineConfig } from 'astro/config';

// Deployed to GitHub Pages project site: https://komrxn.github.io/echelon-site/
export default defineConfig({
  site: 'https://komrxn.github.io',
  base: '/echelon-site',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['ru', 'en', 'uz'],
    defaultLocale: 'ru',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
