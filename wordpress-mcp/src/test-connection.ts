import wpClient from './wpClient';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 直接测试WordPress API
 */
async function testDirectAPI() {
  const baseUrl = process.env.WORDPRESS_SITE_URL || 'https://ai123.dev';
  console.log(`直接测试WordPress API: ${baseUrl}/wp-json`);
  
  try {
    // 增加超时设置
    const response = await axios.get(`${baseUrl}/wp-json`, {
      timeout: 10000
    });
    console.log('API响应状态:', response.status);
    console.log('API命名空间:', response.data?.namespaces);
    
    // 检查是否包含JWT命名空间
    const hasJwtAuth = response.data?.namespaces?.includes('jwt-auth/v1');
    console.log('JWT Auth插件已安装:', hasJwtAuth ? '是' : '否');
    
    return true;
  } catch (error: any) {
    console.error('直接API请求失败:', error.message);
    console.error('响应详情:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : '无响应数据');
    
    return false;
  }
}

/**
 * 测试应用程序密码认证
 */
async function testAppPasswordAuth() {
  const baseUrl = process.env.WORDPRESS_SITE_URL || 'https://ai123.dev';
  const username = process.env.WORDPRESS_USERNAME || '';
  const password = process.env.WORDPRESS_PASSWORD || '';
  
  console.log(`测试应用程序密码认证: ${baseUrl}/wp-json/wp/v2/posts?per_page=1`);
  
  try {
    const response = await axios.get(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
      auth: {
        username: username,
        password: password
      },
      timeout: 10000
    });
    console.log('应用程序密码认证响应状态:', response.status);
    console.log('文章总数:', response.headers['x-wp-total'] || '未知');
    return true;
  } catch (error: any) {
    console.error('应用程序密码认证请求失败:', error.message);
    console.error('响应详情:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : '无响应数据');
    return false;
  }
}

/**
 * 测试Basic认证
 */
async function testBasicAuth() {
  const baseUrl = process.env.WORDPRESS_SITE_URL || 'https://ai123.dev';
  const username = process.env.WORDPRESS_USERNAME || '';
  const password = process.env.WORDPRESS_PASSWORD || '';
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  
  console.log(`测试Basic认证: ${baseUrl}/wp-json/wp/v2/posts?per_page=1`);
  
  try {
    const response = await axios.get(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
      headers: {
        Authorization: `Basic ${credentials}`
      },
      timeout: 10000
    });
    console.log('Basic认证响应状态:', response.status);
    console.log('文章总数:', response.headers['x-wp-total'] || '未知');
    return true;
  } catch (error: any) {
    console.error('Basic认证请求失败:', error.message);
    console.error('响应详情:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : '无响应数据');
    return false;
  }
}

/**
 * 测试JWT认证
 */
async function testJwtAuth() {
  const baseUrl = process.env.WORDPRESS_SITE_URL || 'https://ai123.dev';
  const username = process.env.WORDPRESS_USERNAME || '';
  const password = process.env.WORDPRESS_PASSWORD || '';
  
  console.log(`测试JWT认证: ${baseUrl}/wp-json/jwt-auth/v1/token`);
  
  try {
    // 1. 获取JWT令牌
    const tokenResponse = await axios.post(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
      username: username,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('JWT令牌获取成功');
    
    // 2. 验证令牌
    if (tokenResponse.data && tokenResponse.data.token) {
      const token = tokenResponse.data.token;
      
      try {
        const validateResponse = await axios.post(`${baseUrl}/wp-json/jwt-auth/v1/token/validate`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('JWT令牌验证成功:', validateResponse.data);
        
        // 3. 使用令牌访问受保护资源
        try {
          const protectedResponse = await axios.get(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          });
          
          console.log('使用JWT令牌访问文章成功，状态:', protectedResponse.status);
          console.log('文章总数:', protectedResponse.headers['x-wp-total'] || '未知');
          return true;
        } catch (error: any) {
          console.error('使用JWT令牌访问文章失败:', error.message);
          console.error('响应详情:', error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : '无响应数据');
        }
      } catch (error: any) {
        console.error('JWT令牌验证失败:', error.message);
        console.error('响应详情:', error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : '无响应数据');
      }
    } else {
      console.error('JWT响应中没有令牌:', tokenResponse.data);
    }
    
    return false;
  } catch (error: any) {
    console.error('JWT令牌获取失败:', error.message);
    console.error('响应详情:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : '无响应数据');
    return false;
  }
}

/**
 * 测试MiniOrange Bearer认证
 */
async function testBearerAuth() {
  const baseUrl = process.env.WORDPRESS_SITE_URL || 'https://ai123.dev';
  const jwtSecret = process.env.JWT_SECRET || '';
  
  console.log(`测试Bearer令牌认证: ${baseUrl}/wp-json/wp/v2/posts?per_page=1`);
  
  try {
    const response = await axios.get(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
      headers: {
        'Authorization': `Bearer ${jwtSecret}`
      },
      timeout: 10000
    });
    
    console.log('Bearer令牌认证成功，状态:', response.status);
    console.log('文章总数:', response.headers['x-wp-total'] || '未知');
    return true;
  } catch (error: any) {
    console.error('Bearer令牌认证失败:', error.message);
    console.error('响应详情:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : '无响应数据');
    return false;
  }
}

/**
 * 测试WordPress连接
 */
async function testWordPressConnection() {
  console.log('=========================================');
  console.log('开始WordPress连接测试...');
  console.log('=========================================');
  console.log('环境配置:');
  console.log(`- WordPress站点: ${process.env.WORDPRESS_SITE_URL}`);
  console.log(`- 用户名: ${process.env.WORDPRESS_USERNAME}`);
  console.log(`- JWT Secret: ${process.env.JWT_SECRET ? '已设置' : '未设置'}`);
  console.log('=========================================');
  
  try {
    // 测试直接Bearer认证
    console.log('\n1. 测试Bearer令牌认证');
    await testBearerAuth();
    
    // 测试客户端连接
    console.log('\n2. 测试WordPress客户端');
    const connected = await wpClient.testConnection();
    
    if (connected) {
      console.log('✅ WordPress客户端连接测试成功');
    } else {
      console.error('❌ WordPress客户端连接测试失败');
    }
    
    console.log('\n=========================================');
    console.log('测试完成');
    console.log('=========================================');
  } catch (error: any) {
    console.error('❌ 测试过程出错:', error.message);
  }
}

// 执行测试
testWordPressConnection().catch(err => {
  console.error('测试脚本运行失败:', err);
  process.exit(1);
}); 