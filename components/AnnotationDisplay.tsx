import React from 'react';

export interface Annotation {
  action: 'circle' | 'write' | 'tick' | 'cross' | 'underline';
  bbox: [number, number, number, number];
  comment: string;
}

interface AnnotationDisplayProps {
  annotations: Annotation[];
  imagePreview: string | null;
  imageDimensions?: { width: number; height: number };
}

export default function AnnotationDisplay({ 
  annotations, 
  imagePreview, 
  imageDimensions 
}: AnnotationDisplayProps) {
  if (!imagePreview || annotations.length === 0) {
    return null;
  }

  const displayWidth = 400; // Fixed display width
  const displayHeight = imageDimensions 
    ? (imageDimensions.height / imageDimensions.width) * displayWidth 
    : 300;

  const scaleX = displayWidth / (imageDimensions?.width || 400);
  const scaleY = displayHeight / (imageDimensions?.height || 300);

  // Get color and icon for each action type
  const getActionStyle = (action: string) => {
    switch (action) {
      case 'circle':
        return { color: 'border-red-500 bg-red-100 bg-opacity-30', icon: '⭕' };
      case 'write':
        return { color: 'border-blue-500 bg-blue-100 bg-opacity-30', icon: '✏️' };
      case 'tick':
        return { color: 'border-green-500 bg-green-100 bg-opacity-30', icon: '✅' };
      case 'cross':
        return { color: 'border-red-600 bg-red-200 bg-opacity-30', icon: '❌' };
      case 'underline':
        return { color: 'border-yellow-500 bg-yellow-100 bg-opacity-30', icon: '➖' };
      default:
        return { color: 'border-gray-500 bg-gray-100 bg-opacity-30', icon: '❓' };
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Marking Annotations ({annotations.length})
      </h3>
      
      <div className="space-y-4">
        {/* Image with annotation overlays */}
        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
          <img
            src={imagePreview}
            alt="Homework with annotations"
            className="w-full h-auto"
            style={{ maxWidth: displayWidth, maxHeight: displayHeight }}
          />
          
          {/* Annotation overlays */}
          {annotations.map((annotation, index) => {
            const [x, y, width, height] = annotation.bbox;
            const scaledX = x * scaleX;
            const scaledY = y * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;
            const style = getActionStyle(annotation.action);
            
            return (
              <div
                key={index}
                className={`absolute border-2 ${style.color}`}
                style={{
                  left: scaledX,
                  top: scaledY,
                  width: scaledWidth,
                  height: scaledHeight,
                }}
                title={`${annotation.action.toUpperCase()}: ${annotation.comment}`}
              >
                <div className="absolute -top-6 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                  <span>{style.icon}</span>
                  <span>{index + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Annotation details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Annotation Details</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {annotations.map((annotation, index) => {
              const style = getActionStyle(annotation.action);
              const [x, y, width, height] = annotation.bbox;
              
              return (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded border">
                  <div className={`w-8 h-8 ${style.color.replace('border-', 'bg-').replace(' bg-opacity-30', '')} text-white text-sm rounded-full flex items-center justify-center flex-shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {annotation.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        at [{x}, {y}, {width}, {height}]
                      </span>
                    </div>
                    
                    {/* Show comment for all actions except tick */}
                    {annotation.action !== 'tick' && (
                      <div className="text-sm text-gray-700 bg-gray-100 p-2 rounded border-l-4 border-blue-400">
                        <strong>Comment:</strong> {annotation.comment}
                      </div>
                    )}
                    
                    {annotation.action === 'tick' && (
                      <div className="text-sm text-green-700 bg-green-50 p-2 rounded border-l-4 border-green-400">
                        <strong>Correct!</strong> ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-800 mb-2">Annotation Legend</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div className="flex items-center space-x-2">
              <span>⭕</span>
              <span>Circle - Highlight issue</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✏️</span>
              <span>Write - Add comment</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Tick - Correct answer</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>❌</span>
              <span>Cross - Incorrect</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>➖</span>
              <span>Underline - Emphasize</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
