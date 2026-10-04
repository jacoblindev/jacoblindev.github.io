import {createHash} from 'node:crypto'
import {existsSync, readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {defineConfigWithTheme, type DefaultTheme, type HeadConfig} from 'vitepress'

// Absolute origin for link-preview tags: og:url and og:image must be absolute.
const SITE = 'https://jacoblindev.github.io'
const PUBLIC = fileURLToPath(new URL('../public', import.meta.url))

// LinkedIn caches a preview image by URL, so a re-rendered image at the same
// path keeps showing the old one. Append a short content hash for files in
// docs/public: any change to the file is a new URL, with nothing to remember.
function versioned(publicPath: string): string {
  const file = PUBLIC + publicPath
  if (!existsSync(file)) return publicPath
  const hash = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)
  return `${publicPath}?v=${hash}`
}

// The footer's REV is the newest row of the revision table on /revisions/
// (newest first), read at build time so there is no second place to bump.
function currentRevision(): string {
  const page = readFileSync(fileURLToPath(new URL('../revisions/index.md', import.meta.url)), 'utf8')
  const rev = page.match(/^\|\s*\*\*([A-Z]+)\*\*\s*\|/m)?.[1]
  if (!rev) throw new Error('docs/revisions/index.md: no revision row like "| **A** |" found')
  return rev
}

export type ThemeConfig = DefaultTheme.Config & {revision: string}

// https://vitepress.dev/reference/site-config
export default defineConfigWithTheme<ThemeConfig>({
  title: "JLNotes",
  description: 'Notes on software development — things I build, break and learn, at work and off it. Written to think out loud, and to remember.',
  lang: 'en-US',
  // Each page's last git commit date, shown as DATE in the TitleBlock footer.
  lastUpdated: true,
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
    // Attribution for crawlers (LinkedIn warns without it); not shown on pages.
    ['meta', {name: 'author', content: 'Jacob Lin'}],
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
    const image = new URL(versioned(fm.image ?? '/og-default.png'), url).href
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
        ['meta', {property: 'og:image:width', content: '2400'}],
        ['meta', {property: 'og:image:height', content: '1254'}],
      ] as HeadConfig[]),
    ]
  },
  themeConfig: {
    revision: currentRevision(),
    nav: [
      {text: 'Notes', link: '/notes/'},
      {text: 'Revisions', link: '/revisions/'}
    ],
    sidebar: {
      '/notes/': [
        {
          text: 'Notes',
          items: [
            {text: 'Webhooks are not API calls', link: '/notes/webhooks-are-not-api-calls/'}
          ]
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
