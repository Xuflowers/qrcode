import { createRouter, createWebHashHistory } from 'vue-router'
import CertificateDetail from '../views/frontend/CertificateDetail.vue'
import ImportExcel from '../views/frontend/ImportExcel.vue'

const routes = [
    {
        path: '/',
        redirect: '/import'   // 或 '/certificate/123'
    },
    {
        path: '/certificate/:id',
        name: 'Certificate',
        component: CertificateDetail,
        props: true
    },
    {
        path: '/import',
        name: 'ImportExcel',
        component: ImportExcel
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router