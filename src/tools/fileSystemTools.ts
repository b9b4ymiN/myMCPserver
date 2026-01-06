import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { Tool } from '../types/index.js';

// =====================================================
// FILE SYSTEM TOOLS
// =====================================================

interface ReadFileResult {
  path: string;
  content: string;
  encoding: string;
  size: number;
  lines: number;
  success: boolean;
  message?: string;
}

const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read file contents from the local file system. Supports text files, JSON, code files, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file (relative or absolute)'
      },
      encoding: {
        type: 'string',
        description: 'File encoding',
        enum: ['utf8', 'ascii', 'base64', 'hex'],
        default: 'utf8'
      },
      maxLines: {
        type: 'number',
        description: 'Maximum number of lines to read (0 for full file)',
        default: 0
      }
    },
    required: ['filePath']
  },
  handler: async (args) => {
    const { filePath, encoding = 'utf8', maxLines = 0 } = args;

    try {
      // Resolve to absolute path
      const absolutePath = path.resolve(filePath);

      // Check if file exists
      if (!existsSync(absolutePath)) {
        return {
          path: absolutePath,
          content: '',
          encoding,
          size: 0,
          lines: 0,
          success: false,
          message: `File not found: ${absolutePath}`
        };
      }

      // Check if it's a file (not directory)
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        return {
          path: absolutePath,
          content: '',
          encoding,
          size: 0,
          lines: 0,
          success: false,
          message: `Path is not a file: ${absolutePath}`
        };
      }

      // Read file content
      let content = await fs.readFile(absolutePath, encoding as BufferEncoding);

      // Limit lines if requested
      let actualContent = content;
      let lineCount = content.split('\n').length;

      if (maxLines > 0 && lineCount > maxLines) {
        const lines = content.split('\n');
        actualContent = lines.slice(0, maxLines).join('\n');
        actualContent += `\n... (${lineCount - maxLines} more lines truncated)`;
      }

      const result: ReadFileResult = {
        path: absolutePath,
        content: actualContent,
        encoding,
        size: stats.size,
        lines: lineCount,
        success: true
      };

      return result;
    } catch (error) {
      return {
        path: filePath,
        content: '',
        encoding,
        size: 0,
        lines: 0,
        success: false,
        message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

interface WriteFileResult {
  path: string;
  bytesWritten: number;
  success: boolean;
  message?: string;
}

const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file. Creates the file if it doesn\'t exist, overwrites if it does.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file (relative or absolute)'
      },
      content: {
        type: 'string',
        description: 'Content to write to the file'
      },
      encoding: {
        type: 'string',
        description: 'File encoding',
        enum: ['utf8', 'ascii', 'base64', 'hex'],
        default: 'utf8'
      },
      createDirectories: {
        type: 'boolean',
        description: 'Create parent directories if they don\'t exist',
        default: true
      }
    },
    required: ['filePath', 'content']
  },
  handler: async (args) => {
    const { filePath, content, encoding = 'utf8', createDirectories = true } = args;

    try {
      const absolutePath = path.resolve(filePath);

      // Create parent directories if needed
      if (createDirectories) {
        const dir = path.dirname(absolutePath);
        if (!existsSync(dir)) {
          await fs.mkdir(dir, { recursive: true });
        }
      }

      // Write file
      const buffer = Buffer.from(content, encoding as BufferEncoding);
      await fs.writeFile(absolutePath, buffer);

      const result: WriteFileResult = {
        path: absolutePath,
        bytesWritten: buffer.length,
        success: true
      };

      return result;
    } catch (error) {
      return {
        path: filePath,
        bytesWritten: 0,
        success: false,
        message: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

interface ListDirectoryResult {
  path: string;
  type: 'file' | 'directory';
  entries: Array<{
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size?: number;
    modified?: string;
  }>;
  totalCount: number;
  success: boolean;
  message?: string;
}

const listDirectoryTool: Tool = {
  name: 'list_directory',
  description: 'List files and directories in a given path',
  inputSchema: {
    type: 'object',
    properties: {
      dirPath: {
        type: 'string',
        description: 'Path to the directory (defaults to current working directory)'
      },
      recursive: {
        type: 'boolean',
        description: 'List files recursively',
        default: false
      },
      includeHidden: {
        type: 'boolean',
        description: 'Include hidden files (starting with .)',
        default: false
      },
      pattern: {
        type: 'string',
        description: 'Filter files by pattern (e.g., "*.ts", "data_*")'
      }
    }
  },
  handler: async (args) => {
    const { dirPath = '.', recursive = false, includeHidden = false, pattern } = args;

    try {
      const absolutePath = path.resolve(dirPath);

      // Check if directory exists
      if (!existsSync(absolutePath)) {
        return {
          path: absolutePath,
          type: 'directory' as const,
          entries: [],
          totalCount: 0,
          success: false,
          message: `Directory not found: ${absolutePath}`
        };
      }

      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        return {
          path: absolutePath,
          type: 'directory' as const,
          entries: [],
          totalCount: 0,
          success: false,
          message: `Path is not a directory: ${absolutePath}`
        };
      }

      const entries: Array<{
        name: string;
        path: string;
        type: 'file' | 'directory' | 'symlink';
        size?: number;
        modified?: string;
      }> = [];

      // Helper function to process directory
      const processDir = async (currentPath: string, baseDir: string): Promise<void> => {
        const items = await fs.readdir(currentPath, { withFileTypes: true });

        for (const item of items) {
          // Skip hidden files if not requested
          if (!includeHidden && item.name.startsWith('.')) {
            continue;
          }

          // Apply pattern filter
          if (pattern && !item.name.match(pattern.replace('*', '.*'))) {
            continue;
          }

          const fullPath = path.join(currentPath, item.name);
          const relativePath = path.relative(baseDir, fullPath);
          const itemStats = await fs.stat(fullPath);

          let itemType: 'file' | 'directory' | 'symlink' = 'file';
          if (item.isDirectory()) itemType = 'directory';
          else if (item.isSymbolicLink()) itemType = 'symlink';

          entries.push({
            name: item.name,
            path: relativePath,
            type: itemType,
            size: itemType === 'file' ? itemStats.size : undefined,
            modified: itemStats.mtime.toISOString()
          });

          // Recurse if needed
          if (recursive && itemType === 'directory') {
            await processDir(fullPath, baseDir);
          }
        }
      };

      await processDir(absolutePath, absolutePath);

      const result: ListDirectoryResult = {
        path: absolutePath,
        type: 'directory',
        entries,
        totalCount: entries.length,
        success: true
      };

      return result;
    } catch (error) {
      return {
        path: dirPath,
        type: 'directory',
        entries: [],
        totalCount: 0,
        success: false,
        message: `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

interface FileExistsResult {
  path: string;
  exists: boolean;
  type?: 'file' | 'directory' | 'symlink';
  size?: number;
  modified?: string;
  created?: string;
}

const fileExistsTool: Tool = {
  name: 'file_exists',
  description: 'Check if a file or directory exists and get its metadata',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to check'
      }
    },
    required: ['filePath']
  },
  handler: async (args) => {
    const { filePath } = args;

    try {
      const absolutePath = path.resolve(filePath);
      const exists = existsSync(absolutePath);

      if (!exists) {
        return {
          path: absolutePath,
          exists: false
        };
      }

      const stats = await fs.stat(absolutePath);

      let type: 'file' | 'directory' | 'symlink' = 'file';
      if (stats.isDirectory()) type = 'directory';
      else if (stats.isSymbolicLink()) type = 'symlink';

      const result: FileExistsResult = {
        path: absolutePath,
        exists: true,
        type,
        size: type === 'file' ? stats.size : undefined,
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString()
      };

      return result;
    } catch (error) {
      return {
        path: filePath,
        exists: false
      };
    }
  }
};

interface DeleteFileResult {
  path: string;
  deleted: boolean;
  success: boolean;
  message?: string;
}

const deleteFileTool: Tool = {
  name: 'delete_file',
  description: 'Delete a file or directory (use with caution!)',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file or directory to delete'
      },
      recursive: {
        type: 'boolean',
        description: 'Delete directories recursively (required for non-empty directories)',
        default: false
      }
    },
    required: ['filePath']
  },
  handler: async (args) => {
    const { filePath, recursive = false } = args;

    try {
      const absolutePath = path.resolve(filePath);

      if (!existsSync(absolutePath)) {
        return {
          path: absolutePath,
          deleted: false,
          success: false,
          message: `File not found: ${absolutePath}`
        };
      }

      const stats = await fs.stat(absolutePath);

      if (stats.isDirectory()) {
        await fs.rm(absolutePath, { recursive, force: true });
      } else {
        await fs.unlink(absolutePath);
      }

      const result: DeleteFileResult = {
        path: absolutePath,
        deleted: true,
        success: true
      };

      return result;
    } catch (error) {
      return {
        path: filePath,
        deleted: false,
        success: false,
        message: `Failed to delete: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

interface SearchFilesResult {
  directory: string;
  pattern: string;
  matches: Array<{
    path: string;
    name: string;
    type: 'file' | 'directory';
  }>;
  totalMatches: number;
  success: boolean;
  message?: string;
}

const searchFilesTool: Tool = {
  name: 'search_files',
  description: 'Search for files by name pattern in a directory',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Directory to search in (defaults to current directory)',
        default: '.'
      },
      pattern: {
        type: 'string',
        description: 'File name pattern (e.g., "*.ts", "test_*", "myfile.txt")'
      },
      recursive: {
        type: 'boolean',
        description: 'Search recursively in subdirectories',
        default: true
      }
    },
    required: ['pattern']
  },
  handler: async (args) => {
    const { directory = '.', pattern, recursive = true } = args;

    try {
      const absolutePath = path.resolve(directory);

      if (!existsSync(absolutePath)) {
        return {
          directory: absolutePath,
          pattern,
          matches: [],
          totalMatches: 0,
          success: false,
          message: `Directory not found: ${absolutePath}`
        };
      }

      const matches: Array<{
        path: string;
        name: string;
        type: 'file' | 'directory';
      }> = [];

      const regex = new RegExp(`^${pattern.replace('*', '.*').replace('?', '.')}$`);

      const processDir = async (currentPath: string, baseDir: string): Promise<void> => {
        const items = await fs.readdir(currentPath, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(currentPath, item.name);
          const relativePath = path.relative(baseDir, fullPath);

          if (regex.test(item.name)) {
            matches.push({
              path: relativePath,
              name: item.name,
              type: item.isDirectory() ? 'directory' : 'file'
            });
          }

          if (recursive && item.isDirectory() && !item.name.startsWith('.')) {
            await processDir(fullPath, baseDir);
          }
        }
      };

      await processDir(absolutePath, absolutePath);

      const result: SearchFilesResult = {
        directory: absolutePath,
        pattern,
        matches,
        totalMatches: matches.length,
        success: true
      };

      return result;
    } catch (error) {
      return {
        directory,
        pattern,
        matches: [],
        totalMatches: 0,
        success: false,
        message: `Failed to search files: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

// =====================================================
// EXPORT ALL FILE SYSTEM TOOLS
// =====================================================

export const fileSystemTools: Tool[] = [
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  fileExistsTool,
  deleteFileTool,
  searchFilesTool
];

export { readFileTool, writeFileTool, listDirectoryTool, fileExistsTool, deleteFileTool, searchFilesTool };
