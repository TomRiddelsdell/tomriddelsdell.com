#!/usr/bin/env tsx
/**
 * Comprehensive cleanup script for unused code, workarounds, and deprecated files
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface CleanupItem {
  path: string;
  type: 'file' | 'directory';
  reason: string;
  size?: number;
}

class CodeCleanupAnalyzer {
  private unusedItems: CleanupItem[] = [];
  private workaroundItems: CleanupItem[] = [];
  private demoItems: CleanupItem[] = [];

  async scanProject(): Promise<void> {
    console.log('Scanning project for unused code and workarounds...');
    
    await this.scanForUnusedFiles();
    await this.scanForWorkarounds();
    await this.scanForDemoCode();
    
    this.generateReport();
  }

  private async scanForUnusedFiles(): Promise<void> {
    const candidates = [
      // Test frontend - appears to be a simple verification tool
      {
        path: './interfaces/test-frontend',
        type: 'directory' as const,
        reason: 'Simple test frontend for configuration verification - superseded by main web-frontend'
      },
      
      // Demo script at root level
      {
        path: './run-logging-demo.ts',
        type: 'file' as const,
        reason: 'Standalone demo script for logging system - development utility'
      },
      
      // Attached assets with debug info
      {
        path: './attached_assets',
        type: 'directory' as const,
        reason: 'Collection of debug screenshots and error logs from development'
      },
      
      // Distribution directory
      {
        path: './dist',
        type: 'directory' as const,
        reason: 'Build artifacts directory - should be gitignored and auto-generated'
      },
      
      // Cookies file
      {
        path: './cookies.txt',
        type: 'file' as const,
        reason: 'Development cookies file - potential security risk'
      }
    ];

    for (const item of candidates) {
      if (await this.pathExists(item.path)) {
        const size = await this.getSize(item.path);
        this.unusedItems.push({ ...item, size });
      }
    }
  }

  private async scanForWorkarounds(): Promise<void> {
    // Scan for files containing workaround patterns
    const workaroundPatterns = [
      'TODO:',
      'FIXME:',
      'HACK:',
      'WORKAROUND:',
      'TEMP:',
      'temp-',
      'workaround',
      'legacy-'
    ];

    // Check demo code and development utilities
    const demoFiles = [
      './domains/analytics/src/demos/IssueReproductionDemo.ts',
      './interfaces/api-gateway/src/storage.ts' // Contains demo data initialization
    ];

    for (const file of demoFiles) {
      if (await this.pathExists(file)) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('demo') || content.includes('Demo') || content.includes('initializeData')) {
          this.workaroundItems.push({
            path: file,
            type: 'file',
            reason: 'Contains demo/test data initialization - development utility'
          });
        }
      }
    }
  }

  private async scanForDemoCode(): Promise<void> {
    // Analytics demo directory
    const demoDir = './domains/analytics/src/demos';
    if (await this.pathExists(demoDir)) {
      this.demoItems.push({
        path: demoDir,
        type: 'directory',
        reason: 'Demo code for issue reproduction - development utility'
      });
    }

    // Storage demo data
    const storageFile = './interfaces/api-gateway/src/storage.ts';
    if (await this.pathExists(storageFile)) {
      const content = await fs.readFile(storageFile, 'utf8');
      if (content.includes('initializeData') && content.includes('demo')) {
        this.demoItems.push({
          path: storageFile,
          type: 'file',
          reason: 'Contains demo data initialization methods'
        });
      }
    }
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async getSize(path: string): Promise<number> {
    try {
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        // Get directory size recursively
        return await this.getDirectorySize(path);
      }
      return stats.size;
    } catch {
      return 0;
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    try {
      const items = await fs.readdir(dirPath);
      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch {
      // Ignore errors
    }
    return totalSize;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }

  private generateReport(): void {
    console.log('\n=== CODE CLEANUP ANALYSIS REPORT ===\n');

    if (this.unusedItems.length > 0) {
      console.log('🗑️  UNUSED FILES AND DIRECTORIES:');
      for (const item of this.unusedItems) {
        const sizeInfo = item.size ? ` (${this.formatSize(item.size)})` : '';
        console.log(`   ${item.path}${sizeInfo}`);
        console.log(`   → ${item.reason}\n`);
      }
    }

    if (this.workaroundItems.length > 0) {
      console.log('⚠️  WORKAROUND CODE:');
      for (const item of this.workaroundItems) {
        console.log(`   ${item.path}`);
        console.log(`   → ${item.reason}\n`);
      }
    }

    if (this.demoItems.length > 0) {
      console.log('🧪 DEMO/TEST CODE:');
      for (const item of this.demoItems) {
        console.log(`   ${item.path}`);
        console.log(`   → ${item.reason}\n`);
      }
    }

    const totalItems = this.unusedItems.length + this.workaroundItems.length + this.demoItems.length;
    
    if (totalItems === 0) {
      console.log('✅ No unused code or workarounds found.');
    } else {
      console.log(`📊 SUMMARY: Found ${totalItems} items for potential cleanup`);
      
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   • Remove test-frontend if main web-frontend is working');
      console.log('   • Archive attached_assets debug files to separate location');
      console.log('   • Add dist/ to .gitignore if not already present');
      console.log('   • Remove demo code before production deployment');
      console.log('   • Secure or remove cookies.txt file');
    }
  }
}

// Run analysis if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new CodeCleanupAnalyzer();
  analyzer.scanProject()
    .then(() => {
      console.log('\nCleanup analysis complete.');
    })
    .catch(error => {
      console.error('Analysis failed:', error);
      process.exit(1);
    });
}

export { CodeCleanupAnalyzer };