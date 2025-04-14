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
    this.baseUrl = `${siteUrl}/wp-json/wp/v2`;
    this.username = process.env.WORDPRESS_USERNAME || '';
    this.password = process.env.WORDPRESS_PASSWORD || '';
    
    if (!this.username || !this.password) {
      throw new Error('WordPress 用户名和密码未设置');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器，添加认证头
    this.client.interceptors.request.use(async (config) => {
      if (!this.token) {
        await this.authenticate();
      }
      
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      
      return config;
    });
  }

  /**
   * 获取JWT认证令牌
   */
  private async authenticate(): Promise<void> {
    try {
      const authUrl = `${process.env.WORDPRESS_SITE_URL}/wp-json/jwt-auth/v1/token`;
      const response = await axios.post(authUrl, {
        username: this.username,
        password: this.password,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log('WordPress认证成功');
      } else {
        throw new Error('认证响应中没有令牌');
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
}

export default new WordPressClient(); 