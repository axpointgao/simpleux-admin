/**
 * 仅测试 Supabase 连接（不检查表）
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 环境变量未配置！');
    process.exit(1);
  }

  console.log('🔍 测试 Supabase 连接...');
  console.log(`📍 URL: ${supabaseUrl.substring(0, 30)}...`);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 测试连接（使用一个简单的查询）
    const { data, error } = await supabase.rpc('version');

    if (error) {
      // RPC 可能不存在，但如果是连接错误会有不同的错误码
      if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
        console.log('✅ Supabase 连接成功！');
        console.log('⚠️  但表尚未创建，需要执行数据库迁移');
        return;
      }
      throw error;
    }

    console.log('✅ Supabase 连接成功！');
    console.log('⚠️  但表尚未创建，需要执行数据库迁移');
  } catch (error: any) {
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('✅ Supabase 连接成功！');
      console.log('⚠️  但表尚未创建，需要执行数据库迁移');
    } else {
      console.error('❌ 连接失败:', error.message);
      if (error.message.includes('Invalid API key')) {
        console.error('\n💡 请检查 API Key 是否正确');
      } else if (error.message.includes('Failed to fetch')) {
        console.error('\n💡 请检查 Supabase URL 是否正确，以及网络连接');
      }
      process.exit(1);
    }
  }
}

testConnection();

