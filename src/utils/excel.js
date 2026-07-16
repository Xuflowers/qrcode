import * as XLSX from 'xlsx'

/**
 * 读取 ArrayBuffer 并解析为 JSON 对象数组
 */
export function parseExcelToJson(data) {
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(firstSheet)
}

/**
 * 将原始行映射为证书数据结构，支持多种列名变体
 */
export function mapExcelRowsToCertificates(rows) {
    return rows.map(row => {
        // 辅助：从多个可能的列名中取第一个非空值
        const pick = (keys) => {
            for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    return row[key]
                }
            }
            return ''
        }

        const certNo = pick(['证书编号', '证书号', 'certNo', '编号'])
        const status = pick(['状态', 'status'])
        const clientName = pick(['认证委托人名称', '认证委托人', 'clientName', '委托人'])
        const producerNameAndAddr = pick([
            '产品生产者名称及注册地址',
            '产品生产者名称',
            '生产者地址',
            'producerNameAndAddr'
        ])
        const manufacturerNameAndAddr = pick([
            '生产企业名称及生产地址',
            '产品企业名称及生产地址',   // 用户特别提到
            '生产企业名称',
            '生产地址',
            'manufacturerNameAndAddr'
        ])
        const productsRaw = pick([
            '产品名称和系列、规格、型号',
            '产品型号',
            '规格型号',
            'products'
        ])
        const techonolgyRaw = pick([
            '产品标准和技术要求',
            '标准',
            '技术要求',
            'techonolgy'
        ])

        return {
            certNo,
            status,
            clientName,
            producerNameAndAddr,
            manufacturerNameAndAddr,
            products: splitField(productsRaw),
            techonolgy: splitField(techonolgyRaw)
        }
    })
}

/**
 * 将字符串按常见分隔符拆分为数组，过滤空项
 */
function splitField(value) {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        return value.split(/[,，;；、\s]+/).filter(Boolean)
    }
    return []
}