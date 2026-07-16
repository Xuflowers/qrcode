<template>
  <div class="certificate-container">
    <!-- 顶部标题栏（含返回按钮） -->
    <div class="header">
      <div class="header-left">
        <button v-if="showBack" class="back-btn" @click="goBack">← 返回</button>
      </div>
      <span class="title">证书信息</span>
    </div>

    <!-- 内容卡片 -->
    <div class="card">
      <div class="info-row">
        <span class="label">证书编号：</span>
        <span class="value">{{ certificate.certNo }}</span>
      </div>
      <div class="info-row">
        <span class="label">状态：</span>
        <span class="value" :class="statusClass">{{ certificate.status }}</span>
      </div>
      <div class="info-row">
        <span class="label">认证委托人名称：</span>
        <span class="value">{{ certificate.clientName }}</span>
      </div>
      <div class="info-row">
        <span class="label">产品生产者名称及注册地址：</span>
        <span class="value">{{ certificate.producerNameAndAddr }}</span>
      </div>
      <div class="info-row">
        <span class="label">生产企业名称及生产地址：</span>
        <span class="value">{{ certificate.manufacturerNameAndAddr }}</span>
      </div>

      <!-- 产品型号列表 -->
      <div class="product-section">
        <div class="label-block">产品名称和系列、规格、型号：</div>
        <div
            v-for="(item, index) in certificate.products"
            :key="index"
            class="product-item"
        >
          {{ item }}
        </div>
      </div>

      <!-- 产品标准和技术要求（合并显示） -->
      <div class="product-section">
        <div class="label-block">产品标准和技术要求：</div>
        <div class="product-item product-item-nowrap">
          {{ certificate.techonolgy.join('；') }}
        </div>
      </div>
    </div>

    <!-- 底部文字 + 二维码 -->
    <div class="bottom">
      <span class="message1">查询证书详细信息可登录认监委网站www.cnca.gov.cn或中国质量认证中心网站www.cqc.com.cn查询。</span>
      <br>
      <span class="message2">查询过程中如果有任何问题，请拨打客服电话：xxx-xxxxxxxxx。</span>
      <br>
      <span class="symbol">Copyright © {{ currentYear }}
        <a href="http://www.cqc.com.cn">中国质量认证中心</a>. Allrights reserved.
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()

// 当前年份
const currentYear = new Date().getFullYear()

// 是否显示返回按钮（从后台跳转而来）
const showBack = computed(() => route.query.from === 'back')

// 返回上一页
const goBack = () => {
  router.back()
}

// 证书数据
const certificate = ref({
  certNo: '',
  status: '',
  clientName: '',
  producerNameAndAddr: '',
  manufacturerNameAndAddr: '',
  products: [],
  techonolgy: []
})

// Mock 数据模板（作为默认值补充）
const mockDataTemplate = {
  status: '有效',
  clientName: '福州市飞毛腿科技有限公司',
  producerNameAndAddr: '福州市飞毛腿科技有限公司',
  manufacturerNameAndAddr: '福州市飞毛腿科技有限公司',
  products: ['名称/系列', '规格', '型号'],
  techonolgy: ['GB 31241-2022', 'GB 4943.1-2022', 'GB 17625.1-2022', 'GB/T9254.1-2021']
}

// 计算状态样式
const statusClass = computed(() => {
  return certificate.value.status === '有效' ? 'valid-status' : 'invalid-status'
})

// 生成二维码（直接使用路由参数中的证书编号）
const generateQRCode = () => {
  nextTick(() => {
    const canvas = document.getElementById('qrcode-canvas')
    if (canvas) {
      const certId = route.params.id?.toString().trim()
      const baseUrl = window.location.origin + window.location.pathname
      const url = `${baseUrl}#/certificate/${certId}`
      QRCode.toCanvas(canvas, url, { width: 150, margin: 1 }, (error) => {
        if (error) {
          console.error('二维码生成失败:', error)
        } else {
          console.log('✅ 二维码生成成功，内容：', url)
        }
      })
    } else {
      console.warn('未找到 canvas 元素 #qrcode-canvas')
    }
  })
}

// 组件挂载
onMounted(() => {
  const rawId = route.params.id
  const id = rawId?.toString().trim()
  console.log('🔍 当前证书 ID:', id)

  // 1. 尝试从 sessionStorage 获取导入的数据
  const stored = sessionStorage.getItem('certificateData')
  let found = false
  if (stored) {
    try {
      const map = JSON.parse(stored)
      console.log('📖 从 sessionStorage 读取的 map:', map)
      if (map[id]) {
        // 🔧 合并：mock 作为默认值，导入数据覆盖同名字段，并强制 certNo 为当前 id
        certificate.value = {
          ...mockDataTemplate,
          ...map[id],
          certNo: id
        }
        found = true
        console.log('✅ 使用导入数据，合并后:', certificate.value)
      } else {
        console.warn(`⚠️ map 中不存在 key "${id}"，可用 keys:`, Object.keys(map))
      }
    } catch (e) {
      console.warn('解析 sessionStorage 数据失败', e)
    }
  } else {
    console.warn('sessionStorage 中没有 certificateData')
  }

  // 2. 如果未找到，使用 mock 数据，但将 certNo 设置为当前 id，保证显示一致
  if (!found) {
    console.warn('未在 sessionStorage 中找到证书，使用 mock 数据（但 certNo 设为当前 ID）')
    certificate.value = {
      ...mockDataTemplate,
      certNo: id
    }
  }

  // 生成二维码
  generateQRCode()
})
</script>

<style scoped>
/* ===== 移动端适配样式 ===== */
.certificate-container {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
}

/* 顶部标题 */
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #2c3e50;
  color: white;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
}
.header-left {
  position: absolute;
  left: 16px;
}
.back-btn {
  background: transparent;
  color: white;
  border: 1px solid rgba(255,255,255,0.5);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.back-btn:hover {
  background: rgba(255,255,255,0.2);
}
.title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 2px;
}

/* 内容卡片 */
.card {
  background-color: #ffffff;
  border-radius: 0 0 8px 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 每一行信息 */
.info-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.info-row:last-child {
  border-bottom: none;
}

/* 标签固定宽度，保持对齐 */
.label {
  color: #666666;
  min-width: 120px;
  flex-shrink: 0;
  line-height: 1.5;
}
.value {
  color: #333333;
  flex: 1;
  word-break: break-all;
  line-height: 1.5;
}

/* ===== 状态颜色 ===== */
.valid-status {
  color: #67c23a;
  font-weight: 500;
}
.invalid-status {
  color: #f56c6c;
  font-weight: 500;
}

/* 产品型号区块 */
.product-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #e8ecf1;
}
.label-block {
  color: #666666;
  font-size: 14px;
  margin-bottom: 6px;
}
.product-item {
  background-color: #f8f9fc;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333333;
  border-left: 3px solid #409eff;
}
.product-item-nowrap {
  white-space: pre-wrap;
}

/* 底部 */
.bottom {
  padding: 12px;
  color: #666666;
}
.symbol a {
  color: #409eff;
  text-decoration: none;
}
.symbol a:hover {
  text-decoration: underline;
}

</style>