<template>
  <div class="certificate-container">
    <!-- 顶部标题栏 -->
    <div class="header">
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

      <!-- 二维码区域 -->
      <div class="qrcode-section">
        <div class="label-block">扫码查看证书</div>
        <canvas id="qrcode-canvas" width="150" height="150"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'

const route = useRoute()

// 当前年份（动态生成）
const currentYear = new Date().getFullYear()

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

// 模拟数据（作为后备）
const mockData = {
  certNo: '2026010914861569',
  status: '有效',
  clientName: '福州市飞毛腿科技有限公司',
  producerNameAndAddr: '福州市飞毛腿科技有限公司',
  manufacturerNameAndAddr: '福州市飞毛腿科技有限公司',
  products: ['名称/系列', '规格', '型号'],
  techonolgy: ['GB 31241-2022', 'GB 4943.1-2022', 'GB 17625.1-2022', 'GB/T9254.1-2021']
}

// 计算状态样式类
const statusClass = computed(() => {
  return certificate.value.status === '有效' ? 'valid-status' : 'invalid-status'
})

// 组件挂载时加载数据并生成二维码
onMounted(() => {
  const id = route.params.id
  console.log('🔍 当前证书 ID:', id)

  // 1. 尝试从 sessionStorage 获取导入的数据
  const stored = sessionStorage.getItem('certificateData')
  if (stored) {
    try {
      const map = JSON.parse(stored)
      if (map[id]) {
        certificate.value = map[id]
        // 数据加载后生成二维码
        generateQRCode()
        return
      }
    } catch (e) {
      console.warn('解析 sessionStorage 数据失败', e)
    }
  }

  // 2. 若没有导入的数据或未找到对应 ID，则使用 mock 数据
  certificate.value = mockData
  // 生成二维码
  generateQRCode()
})

// 生成二维码的函数
const generateQRCode = () => {
  nextTick(() => {
    const canvas = document.getElementById('qrcode-canvas')
    if (canvas) {
      // 二维码内容为当前页面的完整 URL（包含 hash）
      const url = window.location.href
      QRCode.toCanvas(canvas, url, { width: 150, margin: 1 }, (error) => {
        if (error) {
          console.error('二维码生成失败:', error)
        } else {
          console.log('✅ 二维码生成成功')
        }
      })
    } else {
      console.warn('未找到 canvas 元素 #qrcode-canvas')
    }
  })
}
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
  background-color: #2c3e50;
  color: white;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  text-align: center;
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

/* 二维码区域 */
.qrcode-section {
  margin-top: 16px;
  text-align: center;
}
.qrcode-section .label-block {
  margin-bottom: 8px;
  font-weight: 500;
}
#qrcode-canvas {
  display: inline-block;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  padding: 4px;
}
</style>