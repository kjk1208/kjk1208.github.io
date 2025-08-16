import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

export async function GET(context) {
  const posts = await getCollection('reviews', p => !p.data.draft);
  return rss({
    title: `${SITE.title} — Reviews`,
    description: SITE.description,
    site: context.site || SITE.baseUrl,
    items: posts.map((post) => ({
      link: `/reviews/${post.slug}/`,
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.summary || ""
    }))
  });
}
