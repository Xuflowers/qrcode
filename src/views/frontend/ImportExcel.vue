<template>
  <div class="import-container">
    <h2>导入证书数据（Excel）</h2>

    <!-- 上传区域 -->
    <div
        class="upload-area"
        @dragover.prevent
        @drop.prevent="handleDrop"
    >
      <p>点击选择或拖拽 Excel 文件（.xlsx / .xls）</p>
      <input
          type="file"
          ref="fileInput"
          accept=".xlsx,.xls"
          @change="handleFileChange"
          style="display: none"
      />
      <button class="upload-btn" @click="$refs.fileInput.click()">
        选择文件
      </button>
      <span v-if="fileName" class="file-name">{{ fileName }}</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">⏳ 解析中，请稍候...</div>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

    <!-- 解析结果 -->
    <div v-if="tableData.length > 0" class="result">
      <h3>解析结果（共 {{ tableData.length }} 条）</h3>
      <div class="table-wrapper">
        <table>
          <thead>
          <tr>
            <th>证书编号</th>
            <th>状态</th>
            <th>认证委托人名称</th>
            <th>产品生产者名称及注册地址</th>
            <th>产品企业名称及生产地址</th>
            <th>产品名称和系列、规格、型号</th>
            <th>产品标准和技术要求</th>
            <th>二维码</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(row, index) in tableData" :key="index">
            <td>{{ row.certNo }}</td>
            <td>
                <span :class="row.status === '有效' ? 'valid' : 'invalid'">
                  {{ row.status }}
                </span>
            </td>
            <td>{{ row.clientName }}</td>
            <td>{{ row.producerNameAndAddr }}</td>
            <td>{{ row.manufacturerNameAndAddr }}</td>
            <td>{{ row.products.join('; ') }}</td>
            <td>{{ row.techonolgy.join('; ') }}</td>
            <!-- 二维码列 -->
            <td>
              <div v-if="row.qrcodeDataURL" class="qrcode-cell">
                <img :src="row.qrcodeDataURL" alt="二维码" width="80" height="80" />
              </div>
              <div v-else class="qrcode-loading">生成中...</div>
            </td>
            <!-- 操作列 -->
            <td>
              <button class="detail-btn" @click="viewDetail(row.certNo)">
                查看详情
              </button>
              <button
                  v-if="row.qrcodeDataURL"
                  class="download-btn"
                  @click="downloadQRCode(row)"
              >
                下载二维码
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseExcelToJson, mapExcelRowsToCertificates } from '@/utils/excel'
import QRCode from 'qrcode'

const router = useRouter()

const fileInput = ref(null)
const fileName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const tableData = ref([])

// 处理文件选择
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) parseAndMapExcel(file)
  e.target.value = ''
}

// 处理拖拽
const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) parseAndMapExcel(file)
}

// 生成二维码 dataURL
const generateQRCodeDataURL = (certNo) => {
  // 二维码内容：当前域名 + 证书详情页路由（带 hash）
  const baseUrl = window.location.origin + window.location.pathname
  const url = `${baseUrl}#/certificate/${certNo}`
  // 返回 Promise，生成 100x100 的二维码
  return QRCode.toDataURL(url, { width: 100, margin: 1 })
}

// 核心解析并存储到 sessionStorage
const parseAndMapExcel = async (file) => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
    errorMsg.value = '请上传 .xlsx 或 .xls 格式的文件'
    return
  }

  loading.value = true
  errorMsg.value = ''
  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = e.target.result
      const rawRows = parseExcelToJson(data)
      const mapped = mapExcelRowsToCertificates(rawRows)

      // 为每一项生成二维码 dataURL（并发处理）
      const promises = mapped.map(item =>
          generateQRCodeDataURL(item.certNo)
              .then(dataURL => {
                item.qrcodeDataURL = dataURL
                return item
              })
              .catch(err => {
                console.warn(`二维码生成失败 (${item.certNo}):`, err)
                item.qrcodeDataURL = null
                return item
              })
      )
      const result = await Promise.all(promises)
      tableData.value = result

      // 存入 sessionStorage，供详情页使用
      const map = {}
      result.forEach(item => {
        if (item.certNo) map[item.certNo] = item
      })
      sessionStorage.setItem('certificateData', JSON.stringify(map))

      loading.value = false
    } catch (err) {
      errorMsg.value = '解析失败：' + err.message
      loading.value = false
    }
  }
  reader.onerror = () => {
    errorMsg.value = '读取文件失败'
    loading.value = false
  }
  reader.readAsArrayBuffer(file)
}

// 跳转到详情页
const viewDetail = (certNo) => {
  if (certNo) {
    router.push({
      path: `/certificate/${certNo}`,
      query: { from: 'back' }
    })
  } else {
    alert('该行数据缺少证书编号')
  }
}

// 下载单个二维码
const downloadQRCode = (row) => {
  if (!row.qrcodeDataURL) return
  const link = document.createElement('a')
  link.download = `${row.certNo}-二维码.png`
  link.href = row.qrcodeDataURL
  link.click()
}
</script>

<style scoped>
/* 原有样式保持不变 */
.import-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
h2 {
  margin-top: 0;
}
.upload-area {
  border: 2px dashed #ccc;
  padding: 30px 20px;
  text-align: center;
  border-radius: 8px;
  transition: border-color 0.3s;
  background: #fafafa;
}
.upload-area:hover {
  border-color: #409eff;
}
.upload-btn {
  background: #409eff;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}
.upload-btn:hover {
  background: #66b1ff;
}
.file-name {
  display: inline-block;
  margin-left: 12px;
  color: #333;
  font-weight: 500;
}
.loading {
  margin-top: 15px;
  color: #409eff;
}
.error {
  margin-top: 15px;
  color: #f56c6c;
}
.result {
  margin-top: 25px;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th,
td {
  padding: 8px 6px;
  border-bottom: 1px solid #eee;
  text-align: left;
  vertical-align: middle;
}
th {
  background: #f5f7fa;
  font-weight: 600;
}
td .valid {
  color: #67c23a;
  font-weight: 500;
}
td .invalid {
  color: #f56c6c;
  font-weight: 500;
}
.detail-btn {
  background: #67c23a;
  color: #fff;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-right: 4px;
}
.detail-btn:hover {
  background: #85ce61;
}
.download-btn {
  background: #409eff;
  color: #fff;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.download-btn:hover {
  background: #66b1ff;
}
.qrcode-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 80px;
  min-height: 80px;
}
.qrcode-loading {
  font-size: 12px;
  color: #999;
}
</style>