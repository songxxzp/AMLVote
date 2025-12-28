import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// 文件大小限制：100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = [
  // 文档
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
  // 视频
  '.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv', '.m4v'
];

// 允许的MIME类型
const ALLOWED_MIME_TYPES = [
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 视频
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/webm',
  'video/x-matroska',
  'video/mp2t'
];

function getFileExtension(filename: string): string {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ext;
}

function isAllowedFile(filename: string, mimeType: string): boolean {
  const ext = getFileExtension(filename);
  const hasValidExtension = ALLOWED_EXTENSIONS.includes(ext);
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(mimeType);

  return hasValidExtension && hasValidMimeType;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!isAllowedFile(file.name, file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Allowed types: PDF, DOC, DOCX, PPT, PPTX, MP4, AVI, MOV, WMV, WEBM, MKV, M4V'
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Return file URL
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: file.name,
      fileSize: file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}