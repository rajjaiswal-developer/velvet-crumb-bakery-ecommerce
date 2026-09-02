import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/lib/imagekit';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { getAdminSession } from '@/lib/auth/session';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;
  // GIF: GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateKey = session?.adminId ? `upload_admin_${session.adminId}` : `upload_ip_${ip}`;
    
    // Rate limit: Allow up to 20 attempts per 15 minutes for admin upload session
    const rateCheck = await checkRateLimit(rateKey, 20, 15 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many upload attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum 5 MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only genuine JPEG, PNG, WEBP, and GIF images are permitted.' },
        { status: 400 }
      );
    }

    const base64File = buffer.toString('base64');

    const uploadResponse = await imagekit.files.upload({
      file: base64File,
      fileName: file.name || `image_${Date.now()}`,
      folder: '/products',
    });

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
      },
    });
  } catch (error) {
    console.error('[ImageKit Upload Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Image upload failed' },
      { status: 500 }
    );
  }
}
