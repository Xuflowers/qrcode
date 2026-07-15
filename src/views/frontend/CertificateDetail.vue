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
        <span class="value status">{{ certificate.status }}</span>
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

      <!-- 产品型号列表（动态渲染） -->
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

      <!-- 产品标准和技术要求（动态渲染） -->
      <div class="product-section">
        <div class="label-block">产品标准和技术要求：</div>
        <div
            v-for="(item, index) in certificate.techonolgy"
            :key="index"
            class="product-item"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 获取路由参数
const route = useRoute()

// 定义响应式数据
const certificate = ref({
  certNo: '',
  status: '',
  clientName: '',
  producerNameAndAddr: '',
  manufacturerNameAndAddr: '',
  products: [],
  techonolgy:'',
})

// 模拟数据（完全参照你提供的图片内容）
const mockData = {
  certNo: '2026010914861569',
  status: '有效',
  clientName: '福州市飞毛腿科技有限公司',
  producerNameAndAddr: '福州市飞毛腿科技有限公司',
  manufacturerNameAndAddr: '福州市飞毛腿科技有限公司',
  products: ['移动电源适配器',
    '移动电源适配器',
    '移动电源适配器'],
  techonolgy: ['GB 31241-2022', 'GB 4943.1-2022', 'GB 17625.1-2022', 'GB/T9254.1-2021']
}

// 组件挂载时加载数据
onMounted(() => {
  const id = route.params.id
  console.log('🔍 当前证书 ID:', id)

  // TODO: 后续对接后端 API 时，这里改为请求接口
  // 目前使用模拟数据
  certificate.value = mockData
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
/* 状态特殊颜色 */
.status {
  color: #67c23a;
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
</style>