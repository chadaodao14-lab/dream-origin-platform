/**
 * 数据库性能测试脚本
 * 评估梦之源创业投资平台的数据库性能表现
 */

import mysql from 'mysql2/promise';

async function testDatabasePerformance() {
    console.log('⚡ 开始数据库性能测试...\n');
    
    let connection;
    
    try {
        // 建立数据库连接
        const connectionConfig = {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'dreamsource_db'
        };

        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ 数据库连接建立成功\n');

        // 1. 连接建立时间测试
        console.log('1️⃣ 连接建立时间测试...');
        const connectStartTime = Date.now();
        const testConnection = await mysql.createConnection(connectionConfig);
        const connectEndTime = Date.now();
        const connectTime = connectEndTime - connectStartTime;
        console.log(`   ⏱️ 连接建立耗时: ${connectTime}ms`);
        await testConnection.end();

        // 2. 简单查询性能测试
        console.log('\n2️⃣ 简单查询性能测试...');
        const simpleQueryStart = Date.now();
        await connection.execute('SELECT 1 as test');
        const simpleQueryEnd = Date.now();
        const simpleQueryTime = simpleQueryEnd - simpleQueryStart;
        console.log(`   ⏱️ 简单查询耗时: ${simpleQueryTime}ms`);

        // 3. 表结构查询性能
        console.log('\n3️⃣ 表结构查询性能...');
        const schemaQueryStart = Date.now();
        const [tables] = await connection.execute('SHOW TABLES');
        const schemaQueryEnd = Date.now();
        const schemaQueryTime = schemaQueryEnd - schemaQueryStart;
        console.log(`   ⏱️ 表结构查询耗时: ${schemaQueryTime}ms`);
        console.log(`   📊 表数量: ${tables.length}`);

        // 4. 数据查询性能测试
        console.log('\n4️⃣ 数据查询性能测试...');
        
        // 测试COUNT查询
        const countQueryStart = Date.now();
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users');
        const countQueryEnd = Date.now();
        const countQueryTime = countQueryEnd - countQueryStart;
        console.log(`   ⏱️ COUNT查询耗时: ${countQueryTime}ms`);
        console.log(`   📊 用户总数: ${countResult[0].total}`);

        // 测试带WHERE条件的查询
        const whereQueryStart = Date.now();
        const [whereResult] = await connection.execute('SELECT * FROM users WHERE is_activated = 1 LIMIT 10');
        const whereQueryEnd = Date.now();
        const whereQueryTime = whereQueryEnd - whereQueryStart;
        console.log(`   ⏱️ 条件查询耗时: ${whereQueryTime}ms`);
        console.log(`   📊 激活用户数量: ${whereResult.length}`);

        // 5. 索引使用情况测试
        console.log('\n5️⃣ 索引使用情况测试...');
        const explainQueryStart = Date.now();
        const [explainResult] = await connection.execute('EXPLAIN SELECT * FROM users WHERE invite_code = "TEST123"');
        const explainQueryEnd = Date.now();
        const explainQueryTime = explainQueryEnd - explainQueryStart;
        console.log(`   ⏱️ EXPLAIN查询耗时: ${explainQueryTime}ms`);
        
        if (explainResult.length > 0) {
            console.log(`   📊 查询类型: ${explainResult[0].type}`);
            console.log(`   📊 使用索引: ${explainResult[0].key || '无'}`);
            console.log(`   📊 扫描行数: ${explainResult[0].rows}`);
        }

        // 6. 批量插入性能测试
        console.log('\n6️⃣ 批量插入性能测试...');
        const batchSize = 100;
        const batchInsertStart = Date.now();
        
        await connection.beginTransaction();
        try {
            for (let i = 0; i < batchSize; i++) {
                await connection.execute(
                    'INSERT INTO users (openId, name, email, loginMethod, role, invite_code, is_activated, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
                    [
                        `perf_test_${Date.now()}_${i}`,
                        `性能测试用户${i}`,
                        `perf${Date.now()}_${i}@example.com`,
                        'performance_test',
                        'user',
                        `PERF${Date.now()}_${i}`,
                        i % 2 // 交替激活状态
                    ]
                );
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }
        
        const batchInsertEnd = Date.now();
        const batchInsertTime = batchInsertEnd - batchInsertStart;
        const avgInsertTime = batchInsertTime / batchSize;
        console.log(`   ⏱️ 批量插入${batchSize}条记录总耗时: ${batchInsertTime}ms`);
        console.log(`   ⏱️ 平均每条插入耗时: ${avgInsertTime.toFixed(2)}ms`);

        // 7. 并发查询性能测试
        console.log('\n7️⃣ 并发查询性能测试...');
        const concurrentQueries = 10;
        const concurrentStart = Date.now();
        
        const promises = [];
        for (let i = 0; i < concurrentQueries; i++) {
            promises.push(connection.execute('SELECT COUNT(*) as cnt FROM users'));
        }
        
        await Promise.all(promises);
        const concurrentEnd = Date.now();
        const concurrentTime = concurrentEnd - concurrentStart;
        console.log(`   ⏱️ ${concurrentQueries}个并发查询总耗时: ${concurrentTime}ms`);
        console.log(`   ⏱️ 平均每个查询耗时: ${(concurrentTime/concurrentQueries).toFixed(2)}ms`);

        // 8. 清理测试数据
        console.log('\n8️⃣ 清理测试数据...');
        const cleanupStart = Date.now();
        await connection.execute("DELETE FROM users WHERE openId LIKE 'perf_test_%' OR openId LIKE 'performance_test%'");
        const cleanupEnd = Date.now();
        console.log(`   ⏱️ 清理耗时: ${cleanupEnd - cleanupStart}ms`);

        await connection.end();
        
        // 9. 性能评估总结
        console.log('\n📊 性能评估总结:');
        console.log('   🔧 连接性能: ' + (connectTime < 100 ? '优秀' : connectTime < 500 ? '良好' : '需要优化'));
        console.log('   🔍 查询性能: ' + (simpleQueryTime < 10 ? '优秀' : simpleQueryTime < 50 ? '良好' : '需要优化'));
        console.log('   🚀 批量插入: ' + (avgInsertTime < 5 ? '优秀' : avgInsertTime < 20 ? '良好' : '需要优化'));
        console.log('   🔄 并发处理: ' + (concurrentTime/concurrentQueries < 20 ? '优秀' : concurrentTime/concurrentQueries < 50 ? '良好' : '需要优化'));

        console.log('\n🎉 数据库性能测试完成！');
        return true;

    } catch (error) {
        console.error('❌ 数据库性能测试失败:', error.message);
        if (connection) {
            await connection.end();
        }
        return false;
    }
}

// 执行测试
testDatabasePerformance().then(success => {
    process.exit(success ? 0 : 1);
});