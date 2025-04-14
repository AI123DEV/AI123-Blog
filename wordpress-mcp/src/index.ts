import { mcpMethods, initFileWatcher } from './mcpMethods';
import { MCPMethodParams, MCPMethodResponse } from './types';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 处理MCP请求
 */
async function handleMCPRequest(input: string): Promise<void> {
  try {
    const request = JSON.parse(input);
    const { method, params = {}, id } = request;
    
    // 验证方法存在
    if (!method || typeof method !== 'string' || !Object.keys(mcpMethods).includes(method)) {
      sendResponse({
        id,
        error: `未知方法: ${method}`,
        result: null
      });
      return;
    }
    
    // 调用对应的方法
    const methodFn = (mcpMethods as any)[method];
    const response: MCPMethodResponse = await methodFn(params as MCPMethodParams);
    
    // 发送响应
    sendResponse({
      id,
      error: response.success ? null : (response.error || null),
      result: response.success ? response.data : null
    });
  } catch (error: any) {
    console.error('处理MCP请求失败:', error.message);
    sendResponse({
      id: null,
      error: `处理请求失败: ${error.message}`,
      result: null
    });
  }
}

/**
 * 发送MCP响应
 */
function sendResponse(response: { id: any; error: string | null; result: any }): void {
  process.stdout.write(JSON.stringify(response) + '\n');
}

/**
 * 监听标准输入
 */
function listenForInput(): void {
  let buffer = '';
  
  process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        handleMCPRequest(line);
      }
    }
  });
  
  process.stdin.on('end', () => {
    if (buffer.trim()) {
      handleMCPRequest(buffer);
    }
    process.exit(0);
  });
  
  process.stdin.resume();
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    console.log('AI123.dev WordPress MCP 服务启动中...');
    
    // 初始化文件监控
    await initFileWatcher();
    
    // 监听标准输入
    listenForInput();
    
    console.log('MCP 服务已启动，等待请求...');
  } catch (error: any) {
    console.error('服务启动失败:', error.message);
    process.exit(1);
  }
}

// 启动服务
main(); 