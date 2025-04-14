import fs from 'fs-extra';
import path from 'path';
import frontMatter from 'front-matter';
import { marked } from 'marked';
import { ArticleWithFrontMatter, ArticleFrontMatter, WordPressPost } from './types';
import wpClient from './wpClient';

export class ArticleProcessor {
  /**
   * 解析Markdown文件，提取前置元数据和内容
   */
  static async parseArticleFile(filePath: string): Promise<ArticleWithFrontMatter> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsed = frontMatter<ArticleFrontMatter>(fileContent);
      
      return {
        frontMatter: parsed.attributes,
        content: parsed.body,
        filePath
      };
    } catch (error: any) {
      console.error(`解析文章文件失败 (${filePath}):`, error.message);
      throw new Error(`解析文章文件失败: ${error.message}`);
    }
  }

  /**
   * 将Markdown内容转换为HTML
   */
  static convertMarkdownToHtml(markdownContent: string): string {
    return marked(markdownContent);
  }

  /**
   * 根据文章前置元数据处理分类
   */
  static async processCategories(frontMatter: ArticleFrontMatter): Promise<number[]> {
    const categoryIds: number[] = [];
    
    // 处理单个category字段
    if (frontMatter.category) {
      try {
        const categoryId = await wpClient.findOrCreateCategory(frontMatter.category);
        categoryIds.push(categoryId);
      } catch (error) {
        console.warn(`处理分类失败 (${frontMatter.category}):`, error);
      }
    }
    
    // 处理categories数组
    if (frontMatter.categories && Array.isArray(frontMatter.categories)) {
      for (const category of frontMatter.categories) {
        try {
          const categoryId = await wpClient.findOrCreateCategory(category);
          if (!categoryIds.includes(categoryId)) {
            categoryIds.push(categoryId);
          }
        } catch (error) {
          console.warn(`处理分类失败 (${category}):`, error);
        }
      }
    }
    
    return categoryIds;
  }

  /**
   * 根据文章前置元数据处理标签
   */
  static async processTags(frontMatter: ArticleFrontMatter): Promise<number[]> {
    const tagIds: number[] = [];
    
    if (frontMatter.tags && Array.isArray(frontMatter.tags)) {
      for (const tag of frontMatter.tags) {
        try {
          const tagId = await wpClient.findOrCreateTag(tag);
          tagIds.push(tagId);
        } catch (error) {
          console.warn(`处理标签失败 (${tag}):`, error);
        }
      }
    }
    
    return tagIds;
  }

  /**
   * 将Markdown文章转换为WordPress文章对象
   */
  static async convertToWordPressPost(article: ArticleWithFrontMatter): Promise<WordPressPost> {
    const { frontMatter, content } = article;
    
    // 将Markdown内容转换为HTML
    const htmlContent = this.convertMarkdownToHtml(content);
    
    // 处理分类和标签
    const categoryIds = await this.processCategories(frontMatter);
    const tagIds = await this.processTags(frontMatter);
    
    // 确定文章状态
    let status: 'draft' | 'publish' | 'private' = 'draft';
    if (frontMatter.status === 'published') {
      status = 'publish';
    }
    
    // 构建WordPress文章对象
    const post: WordPressPost = {
      title: frontMatter.title,
      content: htmlContent,
      status,
      excerpt: frontMatter.excerpt,
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: tagIds.length > 0 ? tagIds : undefined,
      slug: frontMatter.slug
    };
    
    return post;
  }

  /**
   * 发布文章到WordPress
   */
  static async publishToWordPress(article: ArticleWithFrontMatter): Promise<WordPressPost> {
    try {
      const wpPost = await this.convertToWordPressPost(article);
      const publishedPost = await wpClient.createPost(wpPost);
      
      console.log(`发布文章成功: "${article.frontMatter.title}" (ID: ${publishedPost.id})`);
      return publishedPost;
    } catch (error: any) {
      console.error(`发布文章失败:`, error.message);
      throw new Error(`发布文章失败: ${error.message}`);
    }
  }
  
  /**
   * 将文章从一个目录移动到另一个目录
   */
  static async moveArticle(filePath: string, targetDir: string): Promise<string> {
    try {
      const fileName = path.basename(filePath);
      const newFilePath = path.join(targetDir, fileName);
      
      await fs.move(filePath, newFilePath, { overwrite: true });
      console.log(`文章已移动: ${filePath} -> ${newFilePath}`);
      
      return newFilePath;
    } catch (error: any) {
      console.error(`移动文章失败:`, error.message);
      throw new Error(`移动文章失败: ${error.message}`);
    }
  }
}

export default ArticleProcessor; 