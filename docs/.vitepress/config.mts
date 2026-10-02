import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "JLDocs",
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
    }]
  ],
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
