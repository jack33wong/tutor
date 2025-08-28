import React from 'react';

export interface BoundingBoxData {
  text: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface BoundingBoxDisplayProps {
  boundingBoxes: BoundingBoxData[];
  imagePreview: string | null;
  imageDimensions?: { width: number; height: number };
}

export default function BoundingBoxDisplay({ 
  boundingBoxes, 
  imagePreview, 
  imageDimensions 
}: BoundingBoxDisplayProps) {
  if (!imagePreview || boundingBoxes.length === 0) {
    return null;
  }

  const displayWidth = 400; // Fixed display width
  const displayHeight = imageDimensions 
    ? (imageDimensions.height / imageDimensions.width) * displayWidth 
    : 300;

  const scaleX = displayWidth / (imageDimensions?.width || 400);
  const scaleY = displayHeight / (imageDimensions?.height || 300);

  return (
    <div className="card">
             <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Detected Text Regions ({boundingBoxes.length})
      </h3>
      
      <div className="space-y-4">
        {/* Image with bounding box overlays */}
                 <div className="relative border border-gray-800 rounded-lg overflow-hidden">
          <img
            src={imagePreview}
            alt="Homework with bounding boxes"
            className="w-full h-auto"
            style={{ maxWidth: displayWidth, maxHeight: displayHeight }}
          />
          
          {/* Bounding box overlays */}
          {boundingBoxes.map((bbox, index) => {
            const [x1, y1, x2, y2] = bbox.bbox;
            const scaledX = x1 * scaleX;
            const scaledY = y1 * scaleY;
            const scaledWidth = (x2 - x1) * scaleX;
            const scaledHeight = (y2 - y1) * scaleY;
            
            return (
              <div
                key={index}
                className="absolute border-2 border-primary-500 bg-primary-100 bg-opacity-30"
                style={{
                  left: scaledX,
                  top: scaledY,
                  width: scaledWidth,
                  height: scaledHeight,
                }}
                title={`Region ${index + 1}: "${bbox.text}" (Confidence: ${bbox.confidence.toFixed(1)}%)`}
              >
                <div className="absolute -top-6 left-0 bg-primary-500 text-white text-xs px-1 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bounding box details */}
                 <div className="bg-gray-900 p-4 rounded-lg">
                     <h4 className="font-medium text-gray-100 mb-3">Text Region Details</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {boundingBoxes.map((bbox, index) => (
                             <div key={index} className="flex items-start space-x-3 p-2 bg-gray-950 rounded border border-gray-800">
                                  <div className="w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                                     <div className="text-sm font-medium text-gray-100">
                     Coordinates: [{bbox.bbox[0]}, {bbox.bbox[1]}, {bbox.bbox[2]}, {bbox.bbox[3]}]
                   </div>
                   <div className="text-sm text-gray-300 mt-1">
                     <strong>Text:</strong> "{bbox.text || 'No text detected'}"
                   </div>
                   <div className="text-xs text-gray-400 mt-1">
                     Confidence: {bbox.confidence.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing information */}
        <div className="text-xs text-gray-500 bg-primary-50 p-3 rounded-lg">
          <div className="font-medium text-primary-800 mb-1">Processing Information</div>
          <div>• Bounding boxes detected using image processing algorithms</div>
          <div>• Text extracted using OCR (Optical Character Recognition)</div>
          <div>• Coordinates are in pixels relative to original image dimensions</div>
          <div>• Confidence scores indicate OCR accuracy for each region</div>
        </div>
      </div>
    </div>
  );
}
