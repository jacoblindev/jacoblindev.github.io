import DefaultTheme from 'vitepress/theme'
import './style/index.css'
import ChamferedCard from './components/ChamferedCard.vue'
import TitleBlock from './components/TitleBlock.vue'
import NotFound from './components/NotFound.vue'
import { h } from 'vue'
import { useData } from 'vitepress'

export default {
    extends: DefaultTheme,
    Layout: () => {
        const { frontmatter, page } = useData()
        return h(DefaultTheme.Layout, null, {
            // On Doc pages, render in 'doc-after' to respect sidebar layout
            'doc-after': () => h(TitleBlock),
            // On Home page, render in 'layout-bottom' (full width)
            'layout-bottom': () => frontmatter.value.layout === 'home' ? h(TitleBlock) : null,
            'not-found': () => h(NotFound),
        })
    },
    enhanceApp({ app }) {
        app.component('ChamferedCard', ChamferedCard)
        app.component('TitleBlock', TitleBlock)
    }
}
