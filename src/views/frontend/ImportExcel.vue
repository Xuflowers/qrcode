<template>
  <div class="import-container">
    <h2>📄 导入证书数据（Excel）</h2>

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
      <span v-else-if="hasStoredData" class="file-name">📂 已加载上次导入的数据</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">⏳ 解析中，请稍候...</div>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

    <!-- 解析结果 -->
    <div v-if="tableData.length > 0" class="result">
      <div class="result-header">
        <h3>解析结果（共 {{ tableData.length }} 条）</h3>
        <div class="action-buttons">
          <button
              class="export-all-btn"
              @click="batchExportQRCode"
              :disabled="selectedCount === 0"
          >
            ⬇️ 导出选中的二维码（{{ selectedCount }} 个）
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

const router = useRouter()

const fileInput = ref(null)
const fileName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const tableData = ref([])
const hasStoredData = ref(false)

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

// 保存数据
const persistData = (dataArray) => {
  const map = {}
  dataArray.forEach(item => {
    const key = item.certNo?.toString().trim()
    if (key) {
      const cleaned = {
        certNo: key,
        status: item.status?.trim() || '',
        clientName: item.clientName?.trim() || '',
        producerNameAndAddr: item.producerNameAndAddr?.trim() || '',
        manufacturerNameAndAddr: item.manufacturerNameAndAddr?.trim() || '',
        products: Array.isArray(item.products) ? item.products.map(s => s.trim()) : [],
        techonolgy: Array.isArray(item.techonolgy) ? item.techonolgy.map(s => s.trim()) : []
      }
      map[key] = cleaned
    }
  })
  sessionStorage.setItem('certificateData', JSON.stringify(map))

  const listWithQR = dataArray.map(item => ({
    ...item,
    qrcodeDataURL: item.qrcodeDataURL || null
  }))
  sessionStorage.setItem('certificateList', JSON.stringify(listWithQR))
}

// 恢复数据
const restoreData = () => {
  const storedList = sessionStorage.getItem('certificateList')
  if (storedList) {
    try {
      const list = JSON.parse(storedList)
      if (list.length > 0) {
        tableData.value = list
        hasStoredData.value = true
        fileName.value = ''
        selectedRows.value = list.reduce((acc, _, idx) => {
          acc[idx] = true
          return acc
        }, {})
        console.log('✅ 已从 sessionStorage 恢复数据（含二维码），条数:', list.length)
        return true
      }
    } catch (e) {
      console.warn('恢复数据失败:', e)
    }
  }
  return false
}

// 文件处理
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) parseAndMapExcel(file)
  e.target.value = ''
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) parseAndMapExcel(file)
}

// 解析 Excel
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
  hasStoredData.value = false

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = e.target.result
      const rawRows = parseExcelToJson(data)
      console.log('📋 原始 Excel 数据（前3行）:', rawRows.slice(0, 3))

      const mapped = mapExcelRowsToCertificates(rawRows)
      console.log('📋 映射后数据（前3条）:', mapped.slice(0, 3))

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

      selectedRows.value = withQR.reduce((acc, _, idx) => {
        acc[idx] = true
        return acc
      }, {})

      persistData(withQR)
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

// 跳转详情
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

// 单个下载
const downloadQRCode = (row) => {
  if (!row.qrcodeDataURL) return
  const link = document.createElement('a')
  link.download = `${row.certNo}-二维码.png`
  link.href = row.qrcodeDataURL
  link.click()
}

// ✅ 修复：批量导出（使用 fetch 获取 blob）
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

    // 使用 fetch 将 dataURL 转为 Blob，避免手动解码问题
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

// 挂载
onMounted(() => {
  const restored = restoreData()
  if (restored) {
    console.log('📂 页面加载时自动恢复了上次导入的数据（含二维码）')
  } else {
    console.log('📭 无历史数据，等待用户导入')
  }
})
</script>

<style scoped>
/* 原有样式保持不变，新增复选框列宽度 */
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