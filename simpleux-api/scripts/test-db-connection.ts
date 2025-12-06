/**
 * 测试数据库连接脚本
 * 运行: npx tsx scripts/test-db-connection.ts
 */
import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 环境变量未配置！');
    console.error('请确保 .env.local 文件中包含：');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('🔍 测试数据库连接...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 测试1: 检查表是否存在
    console.log('\n📊 测试1: 检查表是否存在...');
    const { data: tables, error: tablesError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (tablesError) {
      if (tablesError.code === 'PGRST116' || tablesError.message.includes('relation') || tablesError.message.includes('does not exist')) {
        console.log('⚠️  表不存在，可能需要先执行数据库迁移');
        console.log('   请运行: supabase/migrations/20241204000000_create_commercial_project_tables.sql');
      } else {
        throw tablesError;
      }
    } else {
      console.log('✅ projects 表存在');
    }

    // 测试2: 检查框架协议表
    console.log('\n📊 测试2: 检查框架协议表...');
    const { error: frameworkError } = await supabase
      .from('framework_agreements')
      .select('id')
      .limit(1);

    if (frameworkError) {
      if (frameworkError.code === 'PGRST116' || frameworkError.message.includes('relation') || frameworkError.message.includes('does not exist')) {
        console.log('⚠️  framework_agreements 表不存在');
      } else {
        throw frameworkError;
      }
    } else {
      console.log('✅ framework_agreements 表存在');
    }

    // 测试3: 检查其他关键表
    const tablesToCheck = [
      'project_stages',
      'project_budgets_labor',
      'project_budgets_travel',
      'project_budgets_outsource',
      'project_expenses_labor',
      'project_expenses_travel',
      'project_expenses_outsource',
      'project_changes',
    ];

    console.log('\n📊 测试3: 检查其他表...');
    for (const tableName of tablesToCheck) {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`⚠️  ${tableName} 表不存在`);
        } else {
          console.log(`❌ ${tableName} 表检查失败: ${error.message}`);
        }
      } else {
        console.log(`✅ ${tableName} 表存在`);
      }
    }

    // 测试4: 测试插入权限（使用 service role key）
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n📊 测试4: 测试写入权限...');
      const testData = {
        code: `TEST-${Date.now()}`,
        name: '测试项目',
        type: '项目制',
        manager_id: '00000000-0000-0000-0000-000000000001',
        manager_name: '测试经理',
        group: '测试部门',
        plan_start_date: '2024-01-01',
        plan_end_date: '2024-12-31',
        created_by: '00000000-0000-0000-0000-000000000001',
      };

      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.log(`⚠️  插入测试失败: ${insertError.message}`);
        if (insertError.message.includes('relation') || insertError.message.includes('does not exist')) {
          console.log('   表不存在，请先执行数据库迁移');
        } else if (insertError.message.includes('foreign key')) {
          console.log('   外键约束错误，可能需要先创建 profiles 表');
        }
      } else {
        console.log('✅ 写入权限正常');
        // 清理测试数据
        await supabase.from('projects').delete().eq('id', insertData.id);
        console.log('✅ 测试数据已清理');
      }
    } else {
      console.log('\n⚠️  未配置 SUPABASE_SERVICE_ROLE_KEY，跳过写入测试');
    }

    console.log('\n✅ 数据库连接测试完成！');
  } catch (error: any) {
    console.error('\n❌ 数据库连接失败:');
    console.error(error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('\n💡 提示: 请检查 API Key 是否正确');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('\n💡 提示: 请检查 Supabase URL 是否正确，以及网络连接');
    }
    process.exit(1);
  }
}

// 加载环境变量
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

testConnection();

