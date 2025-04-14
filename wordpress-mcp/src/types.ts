/**
 * WordPress 文章类型
 */
export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'private';
  categories?: number[];
  tags?: number[];
  excerpt?: string;
  featured_media?: number;
  date?: string;
  slug?: string;
  author?: number;
}

/**
 * WordPress 分类类型
 */
export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  count?: number;
}

/**
 * WordPress 标签类型
 */
export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

/**
 * 文章前置元数据类型
 */
export interface ArticleFrontMatter {
  title: string;
  author?: string;
  date?: string;
  category?: string;
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
  excerpt?: string;
  status?: 'draft' | 'published';
  slug?: string;
}

/**
 * 带有前置元数据的文章
 */
export interface ArticleWithFrontMatter {
  frontMatter: ArticleFrontMatter;
  content: string;
  filePath: string;
}

/**
 * MCP方法请求参数接口
 */
export interface MCPMethodParams {
  [key: string]: any;
}

/**
 * MCP方法响应接口
 */
export interface MCPMethodResponse {
  success: boolean;
  data?: any;
  error?: string;
} 