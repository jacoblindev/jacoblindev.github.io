import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "JLDocs",
  lang: 'en-US',
  appearance: true, // Enabling appearance toggle
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
