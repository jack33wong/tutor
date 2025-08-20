'use client';

import React, { useEffect, useRef, useState } from 'react';

interface GeometryData {
  original?: {
    circle?: {
      center: string;
      diameter?: string;
    };
    triangle?: string;
  };
  setup?: {
    circle?: {
      center: string;
      diameter?: string;
      radius?: number;
    };
    triangle?: string;
  };
  help?: {
    line?: {
      from: string;
      to: string;
    };
    line_to_draw?: {
      description: string;
    };
  };
  instruction?: {
    line_to_draw?: {
      start: string;
      end: string;
    };
    line?: {
      draw: string;
    };
  };
  // Legacy format support
  original_setup?: {
    circle?: {
      center: string;
      radius?: number;
      diameter?: string[];
    };
    triangle?: {
      vertices: string[];
    };
  };
  extra_line?: {
    start_point: string;
    end_point: string;
    description: string;
  };
  [key: string]: any;
}

interface GeometryDiagramProps {
  geometryData: GeometryData;
  className?: string;
}

export default function GeometryDiagram({ geometryData, className = '' }: GeometryDiagramProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstanceRef = useRef<any>(null);
  const [JXG, setJXG] = useState<any>(null);

  useEffect(() => {
    // Dynamically import JSXGraph only on the client side
    const loadJSXGraph = async () => {
      try {
        const jsxgraphModule = await import('jsxgraph');
        setJXG(jsxgraphModule.default);
      } catch (error) {
        // Fallback: try to use global JXG if available
        if (typeof window !== 'undefined' && (window as any).JXG) {
          setJXG((window as any).JXG);
        }
      }
    };

    loadJSXGraph();
  }, []);

  useEffect(() => {
    if (!boardRef.current || !geometryData || !JXG) {
      return;
    }
    
    // Add a small delay to ensure the container is fully mounted
    const timer = setTimeout(() => {
      try {
        // Check if board already exists and clear it
        if (boardInstanceRef.current && JXG) {
          JXG.JSXGraph.freeBoard(boardInstanceRef.current);
        }
        
        // Create new board
        const board = JXG.JSXGraph.initBoard(boardRef.current, {
          boundingbox: [-2.5, 2.5, 2.5, -2.5],
          axis: false,
          grid: false,
          showNavigation: false,
          showCopyright: false,
          showInfobox: false
        });
        boardInstanceRef.current = board;

        try {
          
          // Draw setup (current API response format)
          if (geometryData.setup) {
            const setup = geometryData.setup;
            
            // Draw circle
            if (setup.circle) {
              try {
                let center, radius;
                
                if (setup.circle.center === 'C') {
                  center = board.create('point', [0, 0], { name: 'C', size: 3, color: '#1f77b4' });
                } else {
                  // Parse center coordinates if provided
                  center = board.create('point', [0, 0], { name: setup.circle.center, size: 3, color: '#1f77b4' });
                }

                if (setup.circle.radius) {
                  radius = setup.circle.radius;
                } else if (setup.circle.diameter) {
                  // Handle diameter as string (e.g., "AC")
                  if (setup.circle.diameter === 'AC') {
                    radius = 1.5; // Adjusted radius for better fit
                  } else {
                    radius = 1.5; // Adjusted radius for better fit
                  }
                } else {
                  radius = 1.5; // Adjusted radius for better fit
                }

                const circle = board.create('circle', [center, radius], { 
                  strokeColor: '#1f77b4', 
                  strokeWidth: 2,
                  fillColor: 'none'
                });
                
              } catch (error) {
                console.error('Error drawing circle:', error);
              }
            }

            // Draw triangle - handle any naming convention (ABC, QRS, XYZ, etc.)
            if (setup.triangle && typeof setup.triangle === 'string') {
              const triangleName = setup.triangle;
              
              // Extract the three letters from the triangle name
              const vertices = triangleName.split('').filter(char => /[A-Z]/.test(char));
              
              if (vertices.length >= 3) {
                const [first, second, third] = vertices;
                
                // Check if we have circle diameter information to determine which points are on diameter
                let diameterPoints = [first, second]; // Default: first two points on diameter
                
                if (setup.circle && setup.circle.diameter) {
                  // If circle has diameter info, use it to determine which points are on diameter
                  const diameterName = setup.circle.diameter;
                  const diameterVertices = diameterName.split('').filter(char => /[A-Z]/.test(char));
                  
                  if (diameterVertices.length >= 2) {
                    diameterPoints = diameterVertices.slice(0, 2);
                  }
                }
                
                // Position triangle points around the circle
                // Diameter points on the horizontal line, third point above the center
                const pointFirst = board.create('point', [-1.5, 0], { name: diameterPoints[0], size: 3, color: '#ff7f0e' });
                const pointSecond = board.create('point', [1.5, 0], { name: diameterPoints[1], size: 3, color: '#ff7f0e' });
                const pointThird = board.create('point', [0, 1.5], { name: third, size: 3, color: '#1f77b0' });
                
                // Create triangle segments
                board.create('segment', [pointFirst, pointSecond], { strokeColor: '#ff7f0e', strokeWidth: 2 });
                board.create('segment', [pointSecond, pointThird], { strokeColor: '#ff7f0e', strokeWidth: 2 });
                board.create('segment', [pointThird, pointFirst], { strokeColor: '#ff7f0e', strokeWidth: 2 });
                
              }
            }

          } // Close the if (geometryData.setup) block

          // Draw instruction line AFTER all geometry is created
          if (geometryData.instruction && geometryData.instruction.line && geometryData.instruction.line.draw) {
            const description = geometryData.instruction.line.draw;
            
            try {
              // Use board.elementsByName to find points - this is where JSXGraph stores named elements
              const foundPoints: Array<{ name: string; type: string }> = [];
              
              // Look through elementsByName for points
              Object.keys(board.elementsByName).forEach(name => {
                const element = board.elementsByName[name];
                if (element && typeof element.isDraggable === 'boolean' && typeof element.isReal === 'boolean') {
                  foundPoints.push({ name, type: 'point' });
                }
              });
              
              // Parse description to find any two points mentioned
              // Look for patterns like "from point X to point Y" or "line from X to Y"
              // But be much more specific to avoid picking up letters from words like "from", "point", etc.
              // We'll use a more targeted approach that looks for actual point names
              
              // First, let's try to find actual point names mentioned in the description
              const validPointNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
              const mentionedPoints: string[] = [];
              
              // Use word boundaries to ensure we're finding actual point names, not letters within words
              validPointNames.forEach(name => {
                const pointRegex = new RegExp(`\\b${name}\\b`, 'i');
                if (pointRegex.test(description)) {
                  mentionedPoints.push(name);
                }
              });
              
              if (mentionedPoints.length >= 2) {
                const [point1Name, point2Name] = mentionedPoints.slice(0, 2);
                
                // Find the points using elementsByName
                const point1 = board.elementsByName[point1Name];
                const point2 = board.elementsByName[point2Name];
                
                // Check if points exist and are JSXGraph Point objects
                // JSXGraph points have properties like isDraggable, isReal, hasLabel, etc.
                if (point1 && point2 && 
                    typeof point1.isDraggable === 'boolean' && 
                    typeof point1.isReal === 'boolean' && 
                    typeof point2.isDraggable === 'boolean' && 
                    typeof point2.isReal === 'boolean') {
                  
                  // Draw the line between the two points
                  board.create('segment', [point1, point2], {
                    strokeColor: '#d62728',
                    strokeWidth: 2,
                    dash: 2
                  });
                }
              }
            } catch (error) {
              // Don't show error text, just log it
            }
          }

          // Add legend
          const legend = board.create('text', [-2.2, 2.2, 'Legend:'], { 
            fontSize: 12, 
            color: '#333',
            anchorX: 'left',
            anchorY: 'top'
          });
          
          board.create('text', [-2.2, 1.9, '• Blue: Circle center'], { 
            fontSize: 10, 
            color: '#1f77b4',
            anchorX: 'left',
            anchorY: 'top'
          });
          
          board.create('text', [-2.2, 1.6, '• Orange: Triangle vertices'], { 
            fontSize: 10, 
            color: '#ff7f0e',
            anchorX: 'left',
            anchorY: 'top'
          });
          
          board.create('text', [-2.2, 1.3, '• Red dashed: Extra line'], { 
            fontSize: 10, 
            color: '#d62728',
            anchorX: 'left',
            anchorY: 'top'
          });

        } catch (error) {
          console.error('Error drawing geometry:', error);
          // Only show error if it's a real drawing error, not just missing points
          if (error instanceof Error && error.message.includes('critical')) {
            board.create('text', [0, 0, 'Error drawing diagram'], { 
              fontSize: 16, 
              color: 'red',
              anchorX: 'middle',
              anchorY: 'middle'
            });
          }
        }

        // Cleanup function
        return () => {
          if (boardInstanceRef.current && JXG) {
            JXG.JSXGraph.freeBoard(boardInstanceRef.current);
          }
        };
      } catch (error) {
        console.error('Error during board initialization:', error);
        boardRef.current?.appendChild(document.createTextNode('Error loading diagram.'));
      }
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [geometryData, JXG]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (boardInstanceRef.current && JXG) {
        JXG.JSXGraph.freeBoard(boardInstanceRef.current);
      }
    };
  }, [JXG]);

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Geometry Diagram</h3>
        <p className="text-sm text-gray-600">Interactive diagram based on AI response</p>
      </div>
      <div 
        ref={boardRef} 
        className="w-full h-96 border border-gray-300 rounded-lg bg-white"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
