import { createRouter, createWebHistory } from 'vue-router'
// 使用相对路径（注意层级）
import CertificateDetail from '../views/frontend/CertificateDetail.vue'

const routes = [
    {
        path: '/certificate/:id',
        name: 'Certificate',
        component: CertificateDetail,
        props: true
    }
    ,{
        path: '/',
        redirect: '/certificate/123'   // 访问 / 时自动跳转到示例证书
    },
    {
        path: '/certificate/:id',
        name: 'Certificate',
        component: CertificateDetail,
        props: true
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router