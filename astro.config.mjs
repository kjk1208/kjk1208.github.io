import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Learn more: https://docs.astro.build
export default defineConfig({
  site: 'https://kjk1208.github.io',
  integrations: [
    mdx(),
    expressiveCode()
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }
});
