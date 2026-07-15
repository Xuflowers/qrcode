import { createRouter, createWebHashHistory } from 'vue-router'   // ← 改用 Hash 模式
import CertificateDetail from '../views/frontend/CertificateDetail.vue'

const routes = [
    {
        path: '/',
        redirect: '/certificate/123'   // 根路径自动跳转示例
    },
    {
        path: '/certificate/:id',
        name: 'Certificate',
        component: CertificateDetail,
        props: true
    }
]

const router = createRouter({
    history: createWebHashHistory(),   // ← 使用 Hash 模式，避免 GitHub Pages 刷新 404
    routes
})

export default router