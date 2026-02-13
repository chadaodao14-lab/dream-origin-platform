/**
 * 数据库连接测试脚本
 * 测试梦之源创业投资平台的数据库连接状态
 */

import mysql from 'mysql2/promise';

async function testDatabaseConnection() {
    console.log('🔍 开始数据库连接测试...\n');
    
    try {
        // 从环境变量获取数据库配置
        const connectionConfig = {
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT) || 3306,
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || '',
            database: process.env.DATABASE_NAME || 'dreamsource_db',
            connectTimeout: 5000,
            acquireTimeout: 5000
        };

        console.log('🔌 连接配置:');
        console.log(`   Host: ${connectionConfig.host}:${connectionConfig.port}`);
        console.log(`   User: ${connectionConfig.user}`);
        console.log(`   Database: ${connectionConfig.database}\n`);

        // 建立连接
        console.log('⏳ 正在建立数据库连接...');
        const connection = await mysql.createConnection(connectionConfig);
        
        console.log('✅ 数据库连接成功！\n');

        // 测试基本查询
        console.log('🧪 执行基本查询测试...');
        const [versionResult] = await connection.execute('SELECT VERSION() as version, NOW() as currentTime');
        console.log(`📊 MySQL版本: ${versionResult[0].version}`);
        console.log(`⏰ 当前时间: ${versionResult[0].currentTime}\n`);

        // 检查数据库大小
        const [sizeResult] = await connection.execute(`
            SELECT 
                table_schema AS database_name,
                COUNT(*) AS table_count,
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = ?
            GROUP BY table_schema
        `, [connectionConfig.database]);

        if (sizeResult.length > 0) {
            console.log(`💾 数据库信息:`);
            console.log(`   名称: ${sizeResult[0].database_name}`);
            console.log(`   表数量: ${sizeResult[0].table_count}`);
            console.log(`   大小: ${sizeResult[0].size_mb} MB\n`);
        }

        await connection.end();
        console.log('✅ 数据库连接测试完成！');
        return true;

    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.error('🔧 错误详情:', error);
        return false;
    }
}

// 执行测试
testDatabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
});