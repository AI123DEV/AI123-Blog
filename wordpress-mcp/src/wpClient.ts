import axios, { AxiosInstance } from 'axios';
import { WordPressPost, WordPressCategory, WordPressTag } from './types';
import dotenv from 'dotenv';

dotenv.config();

class WordPressClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private username: string;
  private password: string;
  private token: string | null = null;

  constructor() {
    const siteUrl = process.env.WORDPRESS_SITE_URL || 'https://ai123.dev';
    // 确保URL不包含尾部斜杠
    const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
    
    this.baseUrl = `${baseUrl}/wp-json/wp/v2`;
    this.username = process.env.WORDPRESS_USERNAME || '';
    this.password = process.env.WORDPRESS_PASSWORD || '';
    
    console.log(`WordPress配置: URL=${baseUrl}, 用户=${this.username}`);
    
    if (!this.username || !this.password) {
      throw new Error('WordPress 用户名和密码未设置');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 默认10秒超时
    });

    // 请求拦截器，添加认证头
    this.client.interceptors.request.use(async (config) => {
      // 如果还没有令牌，进行认证
      if (!this.token) {
        await this.authenticate();
      }
      
      // 添加Bearer令牌
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      
      return config;
    });
    
    // 响应拦截器，处理令牌过期
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // 如果是认证错误（401或403）且不是重试请求
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('令牌可能已过期，尝试重新认证...');
          
          // 清除旧令牌并重新获取
          this.token = null;
          
          try {
            await this.authenticate();
            
            // 更新认证头并重试请求
            if (this.token) {
              originalRequest.headers.Authorization = `Bearer ${this.token}`;
              return this.client(originalRequest);
            }
          } catch (err) {
            console.error('重新认证失败');
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取认证令牌
   */
  private async authenticate(): Promise<void> {
    try {
      // 从环境变量中获取JWT Secret
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET环境变量未设置');
      }
      
      // 尝试使用JWT_SECRET作为令牌访问API
      try {
        const response = await axios.get(`${this.baseUrl}/posts?per_page=1`, {
          headers: {
            'Authorization': `Bearer ${jwtSecret}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('认证成功', {
          status: response.status,
          totalPosts: response.headers['x-wp-total'] || '未知'
        });
        
        // 保存令牌
        this.token = jwtSecret;
        return;
      } catch (error: any) {
        console.error('认证失败:', error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : error.message);
        throw new Error('使用JWT_SECRET作为Bearer令牌认证失败');
      }
    } catch (error: any) {
      console.error('WordPress认证失败:', error.message);
      throw new Error(`WordPress认证失败: ${error.message}`);
    }
  }

  /**
   * 创建文章
   */
  async createPost(post: WordPressPost): Promise<WordPressPost> {
    try {
      const response = await this.client.post('/posts', post);
      return response.data;
    } catch (error: any) {
      console.error('创建文章失败:', error.message);
      throw new Error(`创建文章失败: ${error.message}`);
    }
  }

  /**
   * 更新文章
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<WordPressPost> {
    try {
      const response = await this.client.put(`/posts/${postId}`, post);
      return response.data;
    } catch (error: any) {
      console.error(`更新文章(ID: ${postId})失败:`, error.message);
      throw new Error(`更新文章失败: ${error.message}`);
    }
  }

  /**
   * 获取文章列表
   */
  async getPosts(params: {
    perPage?: number;
    page?: number;
    search?: string;
    categories?: number[];
    tags?: number[];
  } = {}): Promise<WordPressPost[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.perPage) queryParams.append('per_page', params.perPage.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.categories) queryParams.append('categories', params.categories.join(','));
      if (params.tags) queryParams.append('tags', params.tags.join(','));

      const response = await this.client.get(`/posts?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('获取文章列表失败:', error.message);
      throw new Error(`获取文章列表失败: ${error.message}`);
    }
  }

  /**
   * 获取分类列表
   */
  async getCategories(params: {
    perPage?: number;
    page?: number;
  } = {}): Promise<WordPressCategory[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.perPage) queryParams.append('per_page', params.perPage.toString());
      if (params.page) queryParams.append('page', params.page.toString());

      const response = await this.client.get(`/categories?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('获取分类列表失败:', error.message);
      throw new Error(`获取分类列表失败: ${error.message}`);
    }
  }

  /**
   * 获取标签列表
   */
  async getTags(params: {
    perPage?: number;
    page?: number;
  } = {}): Promise<WordPressTag[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.perPage) queryParams.append('per_page', params.perPage.toString());
      if (params.page) queryParams.append('page', params.page.toString());

      const response = await this.client.get(`/tags?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('获取标签列表失败:', error.message);
      throw new Error(`获取标签列表失败: ${error.message}`);
    }
  }

  /**
   * 根据名称查找或创建分类
   */
  async findOrCreateCategory(categoryName: string): Promise<number> {
    try {
      // 先查找是否存在
      const categories = await this.getCategories({ perPage: 100 });
      const existingCategory = categories.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategory) {
        return existingCategory.id;
      }

      // 不存在则创建
      const response = await this.client.post('/categories', {
        name: categoryName,
      });

      return response.data.id;
    } catch (error: any) {
      console.error(`查找或创建分类(${categoryName})失败:`, error.message);
      throw error;
    }
  }

  /**
   * 根据名称查找或创建标签
   */
  async findOrCreateTag(tagName: string): Promise<number> {
    try {
      // 先查找是否存在
      const tags = await this.getTags({ perPage: 100 });
      const existingTag = tags.find(
        (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
      );

      if (existingTag) {
        return existingTag.id;
      }

      // 不存在则创建
      const response = await this.client.post('/tags', {
        name: tagName,
      });

      return response.data.id;
    } catch (error: any) {
      console.error(`查找或创建标签(${tagName})失败:`, error.message);
      throw error;
    }
  }

  /**
   * 测试WordPress连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      
      // 测试获取文章列表
      await this.getPosts({ perPage: 1 });
      
      console.log('WordPress连接测试成功');
      return true;
    } catch (error: any) {
      console.error('WordPress连接测试失败:', error.message);
      return false;
    }
  }
}

export default new WordPressClient(); 