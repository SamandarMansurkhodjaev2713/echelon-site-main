// @ts-check
import { defineConfig } from 'astro/config';

// Deployed to GitHub Pages project site: https://samandarmansurkhodjaev2713.github.io/echelon-site-main/
export default defineConfig({
  site: 'https://samandarmansurkhodjaev2713.github.io',
  base: '/echelon-site-main',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['ru', 'en', 'uz'],
    defaultLocale: 'ru',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    /* One document fetch instead of two serialised ones. The site is three
       static pages whose LCP is text, so the render-blocking stylesheet was the
       single biggest thing standing between the visitor and the headline. */
    inlineStylesheets: 'always',
  },
});
