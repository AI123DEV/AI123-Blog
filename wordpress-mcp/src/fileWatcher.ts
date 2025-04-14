import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import ArticleProcessor from './articleProcessor';

dotenv.config();

export class FileWatcher {
  private stagingWatcher: chokidar.FSWatcher;
  private stagingDir: string;
  private publishedDir: string;
  private isInitialized: boolean = false;

  constructor() {
    // 从环境变量获取目录配置
    this.stagingDir = process.env.STAGING_DIR || '../articles/staging';
    this.publishedDir = process.env.PUBLISHED_DIR || '../articles/published';

    // 确保目录存在
    fs.ensureDirSync(this.stagingDir);
    fs.ensureDirSync(this.publishedDir);

    // 初始化staging目录的文件监控
    this.stagingWatcher = chokidar.watch(this.stagingDir, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
  }

  /**
   * 启动文件监控
   */
  async start(): Promise<void> {
    console.log(`开始监控 staging 目录: ${this.stagingDir}`);

    // 监听add事件，处理新增的文件
    this.stagingWatcher.on('add', async (filePath) => {
      // 忽略非Markdown文件
      if (!filePath.endsWith('.md')) {
        return;
      }

      // 避免重复处理初始化阶段的文件
      if (!this.isInitialized) {
        return;
      }

      console.log(`检测到新文件: ${filePath}`);
      await this.processNewStagingFile(filePath);
    });

    // 标记初始化完成
    this.stagingWatcher.on('ready', () => {
      this.isInitialized = true;
      console.log('文件监控初始化完成，已准备好处理新文件');
    });

    // 监听错误
    this.stagingWatcher.on('error', (error) => {
      console.error('文件监控发生错误:', error);
    });
  }

  /**
   * 停止文件监控
   */
  async stop(): Promise<void> {
    await this.stagingWatcher.close();
    console.log('文件监控已停止');
  }

  /**
   * 处理新的staging文件
   */
  private async processNewStagingFile(filePath: string): Promise<void> {
    try {
      console.log(`开始处理staging文件: ${filePath}`);

      // 解析文章
      const article = await ArticleProcessor.parseArticleFile(filePath);
      
      // 发布到WordPress
      const publishedPost = await ArticleProcessor.publishToWordPress(article);
      
      if (publishedPost && publishedPost.id) {
        // 移动文件到published目录
        const newPath = await ArticleProcessor.moveArticle(filePath, this.publishedDir);
        console.log(`文章已发布到WordPress并移动到published目录: ${newPath}`);
      }
    } catch (error: any) {
      console.error(`处理文件失败 (${filePath}):`, error.message);
    }
  }

  /**
   * 处理当前所有staging目录中的文件
   */
  async processAllStagingFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.stagingDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      console.log(`开始处理所有staging文件，共${mdFiles.length}个...`);
      
      for (const file of mdFiles) {
        const filePath = path.join(this.stagingDir, file);
        await this.processNewStagingFile(filePath);
      }
      
      console.log('所有staging文件处理完成');
    } catch (error: any) {
      console.error('处理所有staging文件失败:', error.message);
    }
  }
}

export default FileWatcher; 