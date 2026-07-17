const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const certificateRoutes = require('./routes/certificate');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/certificates', certificateRoutes);

app.get('/health', (req, res) => {
    res.send('OK');
});

mongoose.connect(config.mongodbUri)
    .then(() => {
        console.log('✅ MongoDB 连接成功');
        app.listen(config.port, () => {
            console.log(`🚀 后端服务运行在 http://localhost:${config.port}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB 连接失败:', err);
        process.exit(1);
    });