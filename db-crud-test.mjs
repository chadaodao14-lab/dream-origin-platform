/**
 * 数据库CRUD操作测试脚本
 * 测试梦之源创业投资平台的数据库读写功能
 */

import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

async function testCRUDOperations() {
    console.log('🧪 开始数据库CRUD操作测试...\n');
    
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

        // 1. 测试插入操作
        console.log('1️⃣ 测试INSERT操作...');
        const testUserOpenId = `test_${nanoid(10)}`;
        const testInviteCode = `INV${Date.now()}`;
        
        const insertQuery = `
            INSERT INTO users (openId, name, email, loginMethod, role, invite_code, is_activated, createdAt, updatedAt, lastSignedIn)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        `;
        
        const insertParams = [
            testUserOpenId,
            '测试用户',
            `test${Date.now()}@example.com`,
            'test_login',
            'user',
            testInviteCode,
            1
        ];

        const [insertResult] = await connection.execute(insertQuery, insertParams);
        const newUserId = insertResult.insertId;
        console.log(`   ✅ 插入用户成功，ID: ${newUserId}`);

        // 2. 测试查询操作
        console.log('\n2️⃣ 测试SELECT操作...');
        const [selectResult] = await connection.execute(
            'SELECT * FROM users WHERE id = ?', 
            [newUserId]
        );
        
        if (selectResult.length > 0) {
            console.log(`   ✅ 查询用户成功`);
            console.log(`      用户名: ${selectResult[0].name}`);
            console.log(`      邮箱: ${selectResult[0].email}`);
            console.log(`      激活状态: ${selectResult[0].is_activated ? '已激活' : '未激活'}`);
        }

        // 3. 测试更新操作
        console.log('\n3️⃣ 测试UPDATE操作...');
        const [updateResult] = await connection.execute(
            'UPDATE users SET name = ?, updatedAt = NOW() WHERE id = ?',
            ['更新后的测试用户', newUserId]
        );
        
        console.log(`   ✅ 更新操作影响行数: ${updateResult.affectedRows}`);

        // 验证更新结果
        const [verifyUpdateResult] = await connection.execute(
            'SELECT name FROM users WHERE id = ?',
            [newUserId]
        );
        console.log(`   ✅ 更新验证: ${verifyUpdateResult[0].name}`);

        // 4. 测试关联查询
        console.log('\n4️⃣ 测试关联查询操作...');
        
        // 插入资产记录
        const [assetInsertResult] = await connection.execute(
            'INSERT INTO assets (user_id, total_amount, frozen_amount, available_amount, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [newUserId, '1000.00', '0.00', '1000.00']
        );
        console.log(`   ✅ 插入资产记录成功，ID: ${assetInsertResult.insertId}`);

        // 关联查询用户和资产
        const [joinResult] = await connection.execute(`
            SELECT u.id, u.name, u.email, a.total_amount, a.available_amount
            FROM users u
            LEFT JOIN assets a ON u.id = a.user_id
            WHERE u.id = ?
        `, [newUserId]);

        if (joinResult.length > 0) {
            console.log(`   ✅ 关联查询成功`);
            console.log(`      总资产: ${joinResult[0].total_amount}`);
            console.log(`      可用资产: ${joinResult[0].available_amount}`);
        }

        // 5. 测试删除操作
        console.log('\n5️⃣ 测试DELETE操作...');
        
        // 先删除关联的资产记录
        await connection.execute('DELETE FROM assets WHERE user_id = ?', [newUserId]);
        console.log('   ✅ 删除资产记录成功');
        
        // 再删除用户记录
        const [deleteResult] = await connection.execute('DELETE FROM users WHERE id = ?', [newUserId]);
        console.log(`   ✅ 删除用户记录成功，影响行数: ${deleteResult.affectedRows}`);

        // 6. 测试事务操作
        console.log('\n6️⃣ 测试事务操作...');
        try {
            await connection.beginTransaction();
            
            // 插入测试数据
            const [transUserResult] = await connection.execute(
                'INSERT INTO users (openId, name, email, loginMethod, role, invite_code, is_activated, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
                [`trans_${nanoid(10)}`, '事务测试用户', `trans${Date.now()}@example.com`, 'transaction_test', 'user', `TRANS${Date.now()}`, 1]
            );
            
            const transUserId = transUserResult.insertId;
            console.log(`   ✅ 事务中插入用户，ID: ${transUserId}`);
            
            // 故意制造错误来测试回滚
            // await connection.execute('INVALID SQL STATEMENT');
            
            await connection.commit();
            console.log('   ✅ 事务提交成功');
            
            // 清理测试数据
            await connection.execute('DELETE FROM users WHERE id = ?', [transUserId]);
            
        } catch (error) {
            await connection.rollback();
            console.log('   ⚠️ 事务回滚执行');
            throw error;
        }

        await connection.end();
        console.log('\n🎉 所有CRUD操作测试完成！');
        return true;

    } catch (error) {
        console.error('❌ CRUD操作测试失败:', error.message);
        if (connection) {
            await connection.end();
        }
        return false;
    }
}

// 执行测试
testCRUDOperations().then(success => {
    process.exit(success ? 0 : 1);
});