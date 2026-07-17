const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');

// 批量导入（upsert）
router.post('/import', async (req, res) => {
    try {
        const certificates = req.body;
        if (!Array.isArray(certificates)) {
            return res.status(400).json({ error: '请求体必须是一个数组' });
        }

        const bulkOps = certificates.map(cert => ({
            updateOne: {
                filter: { certNo: cert.certNo },
                update: { $set: cert },
                upsert: true,
            },
        }));

        const result = await Certificate.bulkWrite(bulkOps);
        res.status(200).json({
            message: '导入成功',
            inserted: result.upsertedCount,
            updated: result.modifiedCount,
            total: certificates.length,
        });
    } catch (error) {
        console.error('导入失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 根据证书编号查询
router.get('/:certNo', async (req, res) => {
    try {
        const { certNo } = req.params;
        const certificate = await Certificate.findOne({ certNo: certNo.trim() });
        if (!certificate) {
            return res.status(404).json({ error: '未找到该证书' });
        }
        res.json(certificate);
    } catch (error) {
        console.error('查询失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// （可选）分页列表
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const skip = (page - 1) * limit;
        const certificates = await Certificate.find().skip(skip).limit(Number(limit));
        const total = await Certificate.countDocuments();
        res.json({ data: certificates, total, page: Number(page), limit: Number(limit) });
    } catch (error) {
        console.error('查询列表失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;