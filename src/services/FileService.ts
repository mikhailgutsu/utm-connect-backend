import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_FORMATS = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadedFile {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

export class FileService {
  constructor() {
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists
   */
  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File): string | null {
    if (!file) {
      return 'No file provided';
    }

    if (!ALLOWED_FORMATS.includes(file.mimetype)) {
      return 'Only .jpeg and .png formats are allowed';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit';
    }

    return null;
  }

  /**
   * Save file and return URL
   */
  saveFile(file: Express.Multer.File): UploadedFile {
    const error = this.validateFile(file);
    if (error) {
      throw new Error(error);
    }

    // Generate unique filename
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${hash}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Generate relative URL
    const url = `/uploads/${filename}`;

    return {
      filename,
      path: filePath,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Delete file by filename
   */
  deleteFile(filename: string): void {
    // Security: prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/')) {
      throw new Error('Invalid filename');
    }

    const filePath = path.join(UPLOADS_DIR, filename);

    // Verify file is in uploads directory
    const realPath = fs.realpathSync(UPLOADS_DIR);
    const targetPath = fs.realpathSync(filePath);
    if (!targetPath.startsWith(realPath)) {
      throw new Error('Access denied');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Extract filename from URL
   */
  extractFilename(url: string): string | null {
    if (!url || !url.startsWith('/uploads/')) {
      return null;
    }
    return url.replace('/uploads/', '');
  }
}
