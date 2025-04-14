import { MCPMethodParams, MCPMethodResponse, WordPressPost } from './types';
import wpClient from './wpClient';
import ArticleProcessor from './articleProcessor';
import FileWatcher from './fileWatcher';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

// 文件目录配置
const craftsDir = process.env.CRAFTS_DIR || '../articles/crafts';
const stagingDir = process.env.STAGING_DIR || '../articles/staging';
const publishedDir = process.env.PUBLISHED_DIR || '../articles/published';

// 确保目录存在
fs.ensureDirSync(craftsDir);
fs.ensureDirSync(stagingDir);
fs.ensureDirSync(publishedDir);

// 创建文件监控实例
const fileWatcher = new FileWatcher();

/**
 * 创建文章方法
 */
export async function create_post(params: MCPMethodParams): Promise<MCPMethodResponse> {
  try {
    const { title, content, status = 'draft', categories = [], tags = [] } = params;
    
    if (!title || !content) {
      return {
        success: false,
        error: '标题和内容是必填项'
      };
    }
    
    const post: WordPressPost = {
      title,
      content,
      status,
      categories,
      tags
    };
    
    const createdPost = await wpClient.createPost(post);
    
    return {
      success: true,
      data: createdPost
    };
  } catch (error: any) {
    console.error('创建文章失败:', error.message);
    return {
      success: false,
      error: `创建文章失败: ${error.message}`
    };
  }
}

/**
 * 获取文章列表方法
 */
export async function get_posts(params: MCPMethodParams): Promise<MCPMethodResponse> {
  try {
    const { perPage = 10, page = 1, search, categories, tags } = params;
    
    const posts = await wpClient.getPosts({
      perPage,
      page,
      search,
      categories,
      tags
    });
    
    return {
      success: true,
      data: posts
    };
  } catch (error: any) {
    console.error('获取文章列表失败:', error.message);
    return {
      success: false,
      error: `获取文章列表失败: ${error.message}`
    };
  }
}

/**
 * 更新文章方法
 */
export async function update_post(params: MCPMethodParams): Promise<MCPMethodResponse> {
  try {
    const { postId, title, content, status, categories, tags } = params;
    
    if (!postId) {
      return {
        success: false,
        error: '文章ID是必填项'
      };
    }
    
    const post: Partial<WordPressPost> = {};
    
    if (title) post.title = title;
    if (content) post.content = content;
    if (status) post.status = status;
    if (categories) post.categories = categories;
    if (tags) post.tags = tags;
    
    const updatedPost = await wpClient.updatePost(postId, post);
    
    return {
      success: true,
      data: updatedPost
    };
  } catch (error: any) {
    console.error('更新文章失败:', error.message);
    return {
      success: false,
      error: `更新文章失败: ${error.message}`
    };
  }
}

/**
 * 获取分类列表方法
 */
export async function get_categories(params: MCPMethodParams): Promise<MCPMethodResponse> {
  try {
    const { perPage = 100, page = 1 } = params;
    
    const categories = await wpClient.getCategories({
      perPage,
      page
    });
    
    return {
      success: true,
      data: categories
    };
  } catch (error: any) {
    console.error('获取分类列表失败:', error.message);
    return {
      success: false,
      error: `获取分类列表失败: ${error.message}`
    };
  }
}

/**
 * 获取标签列表方法
 */
export async function get_tags(params: MCPMethodParams): Promise<MCPMethodResponse> {
  try {
    const { perPage = 100, page = 1 } = params;
    
    const tags = await wpClient.getTags({
      perPage,
      page
    });
    
    return {
      success: true,
      data: tags
    };
  } catch (error: any) {
    console.error('获取标签列表失败:', error.message);
    return {
      success: false,
      error: `获取标签列表失败: ${error.message}`
    };
  }
}

/**
 * 初始化文件监控服务
 */
export async function initFileWatcher(): Promise<void> {
  try {
    await fileWatcher.start();
    console.log('文件监控服务已启动');
  } catch (error: any) {
    console.error('初始化文件监控服务失败:', error.message);
  }
}

// 导出所有MCP方法
export const mcpMethods = {
  create_post,
  get_posts,
  update_post,
  get_categories,
  get_tags
}; 