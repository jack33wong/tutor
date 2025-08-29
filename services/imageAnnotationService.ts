import sharp from 'sharp';

export interface Annotation {
  action: 'circle' | 'write' | 'tick' | 'cross' | 'underline';
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  comment: string;
}

export interface MarkingInstructions {
  annotations: Annotation[];
}

export class ImageAnnotationService {
  /**
   * Apply red pen annotations to an image using SVG overlays
   */
  static async applyAnnotations(
    imageBuffer: Buffer,
    instructions: MarkingInstructions,
    imageDimensions: { width: number; height: number }
  ): Promise<Buffer> {
    try {
      console.log('🔍 ImageAnnotationService: Starting annotation overlay...');
      console.log(`🔍 ImageAnnotationService: Image dimensions: ${imageDimensions.width}x${imageDimensions.height}`);
      console.log(`🔍 ImageAnnotationService: Annotations to apply: ${instructions.annotations.length}`);

      // Create SVG overlay with annotations
      const svgOverlay = this.createSVGOverlay(instructions, imageDimensions);
      
      // Apply SVG overlay to image using Sharp
      const annotatedImage = await sharp(imageBuffer)
        .composite([
          {
            input: Buffer.from(svgOverlay),
            top: 0,
            left: 0,
          }
        ])
        .png()
        .toBuffer();

      console.log('🔍 ImageAnnotationService: Annotations applied successfully');
      return annotatedImage;
    } catch (error) {
      console.error('🔍 ImageAnnotationService: Failed to apply annotations:', error);
      throw error;
    }
  }

  /**
   * Create SVG overlay with red pen annotations
   */
  private static createSVGOverlay(
    instructions: MarkingInstructions,
    imageDimensions: { width: number; height: number }
  ): string {
    const { width, height } = imageDimensions;
    
    // Start SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add each annotation
    instructions.annotations.forEach((annotation, index) => {
      const [x1, y1, x2, y2] = annotation.bbox;
      const annotationWidth = x2 - x1;
      const annotationHeight = y2 - y1;
      
      switch (annotation.action) {
        case 'tick':
          svg += this.createTickSVG(x1, y1, x2, y2, index);
          break;
        case 'cross':
          svg += this.createCrossSVG(x1, y1, x2, y2, index);
          break;
        case 'circle':
          svg += this.createCircleSVG(x1, y1, x2, y2, index);
          break;
        case 'underline':
          svg += this.createUnderlineSVG(x1, y1, x2, y2, index);
          break;
        case 'write':
          svg += this.createWriteSVG(x1, y1, x2, y2, annotation.comment, index);
          break;
      }
    });
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Create tick mark SVG
   */
  private static createTickSVG(x1: number, y1: number, x2: number, y2: number, index: number): string {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const size = Math.min(x2 - x1, y2 - y1) * 0.6;
    
    return `
      <g id="tick-${index}">
        <line x1="${centerX - size/2}" y1="${centerY + size/2}" 
              x2="${centerX + size/2}" y2="${centerY - size/2}" 
              stroke="#FF0000" stroke-width="3" stroke-linecap="round"/>
        <line x1="${centerX - size/2}" y1="${centerY - size/2}" 
              x2="${centerX + size/2}" y2="${centerY + size/2}" 
              stroke="#FF0000" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;
  }

  /**
   * Create cross mark SVG
   */
  private static createCrossSVG(x1: number, y1: number, x2: number, y2: number, index: number): string {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const size = Math.min(x2 - x1, y2 - y1) * 0.6;
    
    return `
      <g id="cross-${index}">
        <line x1="${centerX - size/2}" y1="${centerY - size/2}" 
              x2="${centerX + size/2}" y2="${centerY + size/2}" 
              stroke="#FF0000" stroke-width="3" stroke-linecap="round"/>
        <line x1="${centerX - size/2}" y1="${centerY + size/2}" 
              x2="${centerX + size/2}" y2="${centerY - size/2}" 
              stroke="#FF0000" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;
  }

  /**
   * Create circle SVG
   */
  private static createCircleSVG(x1: number, y1: number, x2: number, y2: number, index: number): string {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radius = Math.min(x2 - x1, y2 - y1) / 2;
    
    return `
      <g id="circle-${index}">
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" 
                fill="none" stroke="#FF0000" stroke-width="2"/>
      </g>
    `;
  }

  /**
   * Create underline SVG
   */
  private static createUnderlineSVG(x1: number, y1: number, x2: number, y2: number, index: number): string {
    return `
      <g id="underline-${index}">
        <line x1="${x1}" y1="${y2}" x2="${x2}" y2="${y2}" 
              stroke="#FF0000" stroke-width="2" stroke-linecap="round"/>
      </g>
    `;
  }

  /**
   * Create write comment SVG
   */
  private static createWriteSVG(x1: number, y1: number, x2: number, y2: number, comment: string, index: number): string {
    const fontSize = Math.max(12, Math.min(x2 - x1, y2 - y1) / 8);
    const textX = x1 + 5;
    const textY = y1 + fontSize + 5;
    
    return `
      <g id="write-${index}">
        <rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" 
              fill="rgba(255, 0, 0, 0.1)" stroke="#FF0000" stroke-width="1" rx="3"/>
        <text x="${textX}" y="${textY}" font-family="Caveat, cursive" 
              font-size="${fontSize}" fill="#FF0000" font-weight="bold">${comment}</text>
      </g>
    `;
  }
}
