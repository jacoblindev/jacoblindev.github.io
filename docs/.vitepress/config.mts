import {defineConfig, type HeadConfig} from 'vitepress'

// Absolute origin for link-preview tags: og:url and og:image must be absolute.
const SITE = 'https://jacoblindev.github.io'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "JLNotes",
  description: 'Notes on software development — things I build, break and learn, at work and off it. Written to think out loud, and to remember.',
  lang: 'en-US',
  appearance: true, // Enabling appearance toggle
  markdown: {
    // ```mermaid fences become <Mermaid>, rendered client-side by
    // theme/components/Mermaid.vue. The source is URI-encoded so braces and
    // quotes in diagram syntax never reach Vue's template compiler.
    config(md) {
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          return `<Mermaid code="${encodeURIComponent(token.content)}" />`
        }
        return fence(tokens, idx, options, env, self)
      }
    }
  },
  head: [
    ['link', {rel: 'preconnect', href: 'https://fonts.googleapis.com'}],
    ['link', {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: ''}],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap'
    }],
    // Sources and render script in design/
    ['link', {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'}],
    ['link', {rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48.png'}],
    ['link', {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'}],
    ['meta', {property: 'og:site_name', content: 'JLNotes'}],
    ['meta', {name: 'twitter:card', content: 'summary_large_image'}]
  ],
  // Per-page link-preview tags (LinkedIn, Slack, X, iMessage…). A post sets
  // `description`, and optionally `image` + `imageAlt`, in its frontmatter;
  // anything unset falls back to the site description and the default card.
  // `image` is a path under docs/public (e.g. /og/<slug>.png), because an
  // image referenced only from frontmatter is never processed by Vite.
  transformHead({pageData, siteConfig}): HeadConfig[] {
    const fm = pageData.frontmatter
    // notes/<slug>/index.md → /notes/<slug>/, index.md → /
    const path = '/' + pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
    const url = SITE + path
    const isPost = /^\/notes\/[^/]+\/$/.test(path)
    const image = fm.image ? new URL(fm.image, url).href : `${SITE}/og-default.png`
    const imageAlt = fm.imageAlt ?? (fm.image ? pageData.title : 'JLNotes — notes on software development')

    return [
      ['link', {rel: 'canonical', href: url}],
      ['meta', {property: 'og:type', content: isPost ? 'article' : 'website'}],
      ['meta', {property: 'og:url', content: url}],
      ['meta', {property: 'og:title', content: pageData.title || siteConfig.site.title}],
      ['meta', {property: 'og:description', content: fm.description ?? siteConfig.site.description}],
      ['meta', {property: 'og:image', content: image}],
      ['meta', {property: 'og:image:alt', content: imageAlt}],
      ...(fm.image ? [] : [
        ['meta', {property: 'og:image:width', content: '1200'}],
        ['meta', {property: 'og:image:height', content: '627'}],
      ] as HeadConfig[]),
    ]
  },
  themeConfig: {
    nav: [
      {text: 'Notes', link: '/notes/'}
    ],
    sidebar: {
      '/notes/': [
        {
          text: 'Notes',
          items: []
        }
      ]
    },
    search: {
      provider: 'local'
    },
    socialLinks: [
      {icon: 'github', link: 'https://github.com/jacoblindev'},
      {icon: 'linkedin', link: 'https://www.linkedin.com/in/jacob-lin-dev'}
    ]
  }
})
