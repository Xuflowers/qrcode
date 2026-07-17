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
      <span v-else-if="tableData.length > 0" class="file-name">📂 已加载数据</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">⏳ 解析中，请稍候...</div>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success">{{ successMsg }}</div>

    <!-- 解析结果 -->
    <div v-if="tableData.length > 0" class="result">
      <div class="result-header">
        <h3>解析结果（共 {{ tableData.length }} 条）</h3>
        <div class="action-buttons">
          <button class="export-all-btn" @click="batchExportQRCode" :disabled="selectedCount === 0">
            导出选中的二维码（{{ selectedCount }} 个）
          </button>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
          <tr>
            <th style="width: 40px;">
              <input type="checkbox" @change="toggleAll" :checked="isAllSelected" />
            </th>
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
            <td>
              <input type="checkbox" v-model="selectedRows[index]" />
            </td>
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
            <td>
              <div v-if="row.qrcodeDataURL" class="qrcode-cell">
                <img :src="row.qrcodeDataURL" alt="二维码" width="80" height="80" />
              </div>
              <div v-else class="qrcode-loading">二维码缺失</div>
            </td>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { parseExcelToJson, mapExcelRowsToCertificates } from '@/utils/excel'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { importCertificates } from '@/api/certificate'

const router = useRouter()

const fileInput = ref(null)
const fileName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const tableData = ref([])

// 选中状态
const selectedRows = ref({})

const selectedCount = computed(() => {
  return Object.values(selectedRows.value).filter(Boolean).length
})

const isAllSelected = computed(() => {
  if (tableData.value.length === 0) return false
  return selectedCount.value === tableData.value.length
})

const toggleAll = (event) => {
  const checked = event.target.checked
  tableData.value.forEach((_, index) => {
    selectedRows.value[index] = checked
  })
}

// 生成二维码 dataURL
const generateQRCodeDataURL = (certNo) => {
  const baseUrl = window.location.origin + window.location.pathname
  const url = `${baseUrl}#/certificate/${certNo}`
  return QRCode.toDataURL(url, { width: 100, margin: 1 })
}

// 处理文件选择
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) parseAndMapExcel(file)
  e.target.value = ''
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) parseAndMapExcel(file)
}

// 核心解析并存储
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
  successMsg.value = ''
  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = e.target.result
      const rawRows = parseExcelToJson(data)
      console.log('📋 原始 Excel 数据（前3行）:', rawRows.slice(0, 3))

      const mapped = mapExcelRowsToCertificates(rawRows)
      console.log('📋 映射后数据（前3条）:', mapped.slice(0, 3))

      // 为每条数据生成二维码
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
      const withQR = await Promise.all(promises)
      tableData.value = withQR

      // ----- 调用后端 API 保存数据 -----
      try {
        // 注意：后端需要的是不含二维码的数据，因为二维码是前端生成的，不存储
        const dataToSave = withQR.map(({ qrcodeDataURL, ...rest }) => rest)
        const result = await importCertificates(dataToSave)
        console.log('✅ 后端导入结果:', result)
        successMsg.value = `成功导入 ${result.inserted + result.updated} 条记录`
      } catch (err) {
        console.error('❌ 后端导入失败:', err)
        errorMsg.value = '数据保存到服务器失败，请检查网络或后端服务'
        loading.value = false
        return
      }

      // 默认全选
      selectedRows.value = withQR.reduce((acc, _, idx) => {
        acc[idx] = true
        return acc
      }, {})

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

// 跳转到详情页（携带 from=back）
const viewDetail = (certNo) => {
  const trimmed = certNo?.toString().trim()
  if (trimmed) {
    router.push({
      path: `/certificate/${trimmed}`,
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

// 批量导出选中的二维码
const batchExportQRCode = async () => {
  const selectedItems = tableData.value.filter((_, index) => selectedRows.value[index])
  const validItems = selectedItems.filter(item => item.qrcodeDataURL)

  if (validItems.length === 0) {
    alert('所选数据中没有可导出的二维码')
    return
  }

  if (!confirm(`即将导出 ${validItems.length} 个二维码，是否继续？`)) return

  try {
    const zip = new JSZip()
    const folder = zip.folder('二维码')

    for (const item of validItems) {
      const response = await fetch(item.qrcodeDataURL)
      const blob = await response.blob()
      const fileName = `${item.certNo}-二维码.png`
      folder.file(fileName, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    link.download = `二维码_${timestamp}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (err) {
    console.error('批量导出失败:', err)
    alert('导出失败，请查看控制台错误信息')
  }
}

// 组件挂载时不再需要恢复 sessionStorage，直接等待用户导入
onMounted(() => {
  console.log('📭 等待用户导入数据')
})
</script>

<style scoped>
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
.success {
  margin-top: 15px;
  color: #67c23a;
}
.result {
  margin-top: 25px;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.result-header h3 {
  margin: 0;
}
.action-buttons {
  display: flex;
  gap: 10px;
}
.export-all-btn {
  background: #ff9800;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.export-all-btn:hover:not(:disabled) {
  background: #fb8c00;
}
.export-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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
th:first-child,
td:first-child {
  text-align: center;
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