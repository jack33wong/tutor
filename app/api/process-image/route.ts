import { NextRequest, NextResponse } from 'next/server';
import { ImageProcessingService } from '@/services/imageProcessingService';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Processing image...');
    
    // Process the image using the server-side service
    const result = await ImageProcessingService.processImage(imageData);
    
    console.log('🔍 API: Image processing completed successfully');
    
    return NextResponse.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('🔍 API: Image processing failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Image processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
