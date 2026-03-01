"use client";

import { useState, useRef, useEffect } from 'react';
import { Plus, Save, Download, Upload, Trash2, Edit, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { triggerHapticFeedback } from '@/lib/utils/mobile-navigation';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  isRoot: boolean;
  parentId?: string;
  children: string[];
}

interface MindMap {
  id: string;
  title: string;
  subject: string;
  nodes: MindMapNode[];
  connections: Array<{ from: string; to: string }>;
  createdAt: Date;
  updatedAt: Date;
}

interface MindMapCreatorProps {
  mindMaps: MindMap[];
  onSaveMindMap: (mindMap: Partial<MindMap>) => void;
  onDeleteMindMap: (mindMapId: string) => void;
  className?: string;
}

export function MindMapCreator({
  mindMaps,
  onSaveMindMap,
  onDeleteMindMap,
  className
}: MindMapCreatorProps) {
  const { isSimplified, isMobile } = useMobileNavigation({ className });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMindMap, setSelectedMindMap] = useState<MindMap | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newMapForm, setNewMapForm] = useState({
    title: '',
    subject: 'Other',
    rootText: ''
  });

  const subjects = ['Math', 'Science', 'English', 'History', 'Geography', 'Other'];
  const nodeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#06B6D4'];

  const createNewMindMap = () => {
    if (!newMapForm.title || !newMapForm.rootText) return;

    const rootNode: MindMapNode = {
      id: 'root',
      text: newMapForm.rootText,
      x: 400,
      y: 300,
      color: nodeColors[0],
      isRoot: true,
      children: []
    };

    const newMindMap: Partial<MindMap> = {
      title: newMapForm.title,
      subject: newMapForm.subject,
      nodes: [rootNode],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSaveMindMap(newMindMap);
    setIsCreating(false);
    setNewMapForm({ title: '', subject: 'Other', rootText: '' });
    if (isMobile) triggerHapticFeedback('medium');
  };

  const addNode = (parentId: string) => {
    if (!selectedMindMap) return;

    const parentNode = selectedMindMap.nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newNode: MindMapNode = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Node',
      x: parentNode.x + (Math.random() - 0.5) * 200,
      y: parentNode.y + (Math.random() - 0.5) * 200,
      color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
      isRoot: false,
      parentId,
      children: []
    };

    const updatedNodes = [...selectedMindMap.nodes, newNode];
    const updatedConnections = [...selectedMindMap.connections, { from: parentId, to: newNode.id }];
    
    // Update parent's children
    const updatedParent = { ...parentNode, children: [...parentNode.children, newNode.id] };
    const finalNodes = updatedNodes.map(n => n.id === parentId ? updatedParent : n);

    const updatedMindMap = {
      ...selectedMindMap,
      nodes: finalNodes,
      connections: updatedConnections,
      updatedAt: new Date()
    };

    setSelectedMindMap(updatedMindMap);
    onSaveMindMap(updatedMindMap);
    if (isMobile) triggerHapticFeedback('light');
  };

  const updateNodeText = (nodeId: string, text: string) => {
    if (!selectedMindMap) return;

    const updatedNodes = selectedMindMap.nodes.map(node =>
      node.id === nodeId ? { ...node, text } : node
    );

    const updatedMindMap = {
      ...selectedMindMap,
      nodes: updatedNodes,
      updatedAt: new Date()
    };

    setSelectedMindMap(updatedMindMap);
    onSaveMindMap(updatedMindMap);
  };

  const deleteNode = (nodeId: string) => {
    if (!selectedMindMap || nodeId === 'root') return;

    const nodeToDelete = selectedMindMap.nodes.find(n => n.id === nodeId);
    if (!nodeToDelete) return;

    // Remove node and all its children recursively
    const nodesToDelete = new Set([nodeId]);
    const findChildren = (id: string) => {
      const node = selectedMindMap.nodes.find(n => n.id === id);
      if (node) {
        node.children.forEach(childId => {
          nodesToDelete.add(childId);
          findChildren(childId);
        });
      }
    };
    findChildren(nodeId);

    const updatedNodes = selectedMindMap.nodes.filter(n => !nodesToDelete.has(n.id));
    const updatedConnections = selectedMindMap.connections.filter(
      c => !nodesToDelete.has(c.from) && !nodesToDelete.has(c.to)
    );

    // Update parent's children
    if (nodeToDelete.parentId) {
      const parent = updatedNodes.find(n => n.id === nodeToDelete.parentId);
      if (parent) {
        parent.children = parent.children.filter(id => id !== nodeId);
      }
    }

    const updatedMindMap = {
      ...selectedMindMap,
      nodes: updatedNodes,
      connections: updatedConnections,
      updatedAt: new Date()
    };

    setSelectedMindMap(updatedMindMap);
    onSaveMindMap(updatedMindMap);
    if (isMobile) triggerHapticFeedback('medium');
  };

  const drawMindMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedMindMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    // Draw connections
    selectedMindMap.connections.forEach(connection => {
      const fromNode = selectedMindMap.nodes.find(n => n.id === connection.from);
      const toNode = selectedMindMap.nodes.find(n => n.id === connection.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw nodes
    selectedMindMap.nodes.forEach(node => {
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.isRoot ? 40 : 30, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Node text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = node.isRoot ? 'bold 14px Arial' : '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Wrap text if too long
      const maxWidth = node.isRoot ? 70 : 50;
      const words = node.text.split(' ');
      let line = '';
      let y = node.y;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, node.x, y);
          line = words[n] + ' ';
          y += 16;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, node.x, y);
    });

    ctx.restore();
  };

  useEffect(() => {
    drawMindMap();
  }, [selectedMindMap, zoom, pan]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedMindMap) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x * zoom) / zoom;
    const y = (event.clientY - rect.top - pan.y * zoom) / zoom;

    // Find clicked node
    const clickedNode = selectedMindMap.nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= (node.isRoot ? 40 : 30);
    });

    if (clickedNode) {
      setEditingNode(clickedNode.id);
      if (isMobile) triggerHapticFeedback('light');
    }
  };

  if (isSimplified) {
    // Simplified layout for primary classes (1-5)
    return (
      <div className="space-y-4">
        {/* Simple Header */}
        <Card className="bg-gradient-to-r from-indigo-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Mind Maps</h2>
                <p className="text-indigo-100">{mindMaps.length} maps</p>
              </div>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-white/20 hover:bg-white/30 touch-target-primary"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedMindMap ? (
          // Simple Mind Map Viewer
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedMindMap.title}</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMindMap(null)}
                    className="touch-target-primary"
                  >
                    Back
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="p-2">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-96 border rounded-lg cursor-pointer"
                  onClick={handleCanvasClick}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => addNode('root')}
                className="touch-target-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
              <Button
                variant="outline"
                onClick={() => setZoom(1)}
                className="touch-target-primary"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>
            </div>

            {editingNode && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Edit Node Text:</label>
                    <Input
                      value={selectedMindMap.nodes.find(n => n.id === editingNode)?.text || ''}
                      onChange={(e) => updateNodeText(editingNode, e.target.value)}
                      className="touch-target-primary"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingNode(null)}
                        className="flex-1 touch-target-primary"
                      >
                        Done
                      </Button>
                      {editingNode !== 'root' && (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            deleteNode(editingNode);
                            setEditingNode(null);
                          }}
                          className="touch-target-primary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Simple Mind Map List
          <div className="grid grid-cols-1 gap-4">
            {mindMaps.map((mindMap) => (
              <Card 
                key={mindMap.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedMindMap(mindMap);
                  if (isMobile) triggerHapticFeedback('light');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{mindMap.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{mindMap.subject}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {mindMap.nodes.length} nodes
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(mindMap.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMindMap(mindMap.id);
                      }}
                      className="touch-target-primary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Simple Create Form */}
        {isCreating && (
          <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
            <CardHeader>
              <CardTitle>Create New Mind Map</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Mind map title..."
                value={newMapForm.title}
                onChange={(e) => setNewMapForm(prev => ({ ...prev, title: e.target.value }))}
                className="touch-target-primary"
              />
              
              <select
                value={newMapForm.subject}
                onChange={(e) => setNewMapForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full p-3 border rounded-lg touch-target-primary"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <Input
                placeholder="Main topic (center node)..."
                value={newMapForm.rootText}
                onChange={(e) => setNewMapForm(prev => ({ ...prev, rootText: e.target.value }))}
                className="touch-target-primary"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={createNewMindMap}
                  className="flex-1 touch-target-primary"
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 touch-target-primary"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Full layout for secondary classes (6-12)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mind Map Creator</h2>
          <p className="text-muted-foreground">
            Create visual representations of your ideas and concepts
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className={isMobile ? 'touch-target-secondary' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Mind Map
        </Button>
      </div>

      {selectedMindMap ? (
        // Mind Map Editor
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedMindMap.title}</CardTitle>
                <Badge variant="secondary">{selectedMindMap.subject}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => addNode('root')}
                    className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Node
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(zoom * 1.2)}
                      className={isMobile ? 'touch-target-secondary' : ''}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(zoom * 0.8)}
                      className={isMobile ? 'touch-target-secondary' : ''}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset View
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Statistics</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Nodes:</span>
                      <span>{selectedMindMap.nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connections:</span>
                      <span>{selectedMindMap.connections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(selectedMindMap.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMindMap(null)}
                    className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    Back to List
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDeleteMindMap(selectedMindMap.id);
                      setSelectedMindMap(null);
                    }}
                    className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Map
                  </Button>
                </div>
              </CardContent>
            </Card>

            {editingNode && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Edit Node</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={selectedMindMap.nodes.find(n => n.id === editingNode)?.text || ''}
                    onChange={(e) => updateNodeText(editingNode, e.target.value)}
                    placeholder="Node text..."
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingNode(null)}
                      className={`flex-1 ${isMobile ? 'touch-target-secondary' : ''}`}
                    >
                      Done
                    </Button>
                    {editingNode !== 'root' && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deleteNode(editingNode);
                          setEditingNode(null);
                        }}
                        className={isMobile ? 'touch-target-secondary' : ''}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {editingNode !== 'root' && (
                    <Button
                      variant="outline"
                      onClick={() => addNode(editingNode)}
                      className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Child Node
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={700}
                  className="w-full border rounded-lg cursor-pointer"
                  onClick={handleCanvasClick}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Mind Map List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mindMaps.map((mindMap) => (
            <Card 
              key={mindMap.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedMindMap(mindMap);
                if (isMobile) triggerHapticFeedback('light');
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{mindMap.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{mindMap.subject}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {mindMap.nodes.length} nodes
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMindMap(mindMap.id);
                    }}
                    className={isMobile ? 'touch-target-secondary' : ''}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-2"></div>
                      <p className="text-xs">Mind Map Preview</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Updated {new Date(mindMap.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {mindMaps.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Mind Maps Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first mind map to organize your thoughts visually
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Mind Map
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Mind Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Mind map title..."
                value={newMapForm.title}
                onChange={(e) => setNewMapForm(prev => ({ ...prev, title: e.target.value }))}
              />
              
              <select
                value={newMapForm.subject}
                onChange={(e) => setNewMapForm(prev => ({ ...prev, subject: e.target.value }))}
                className="p-2 border rounded-lg"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            <Input
              placeholder="Main topic (center node)..."
              value={newMapForm.rootText}
              onChange={(e) => setNewMapForm(prev => ({ ...prev, rootText: e.target.value }))}
            />
            
            <div className="flex items-center gap-2">
              <Button
                onClick={createNewMindMap}
                className={isMobile ? 'touch-target-secondary' : ''}
              >
                <Save className="h-4 w-4 mr-2" />
                Create Mind Map
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className={isMobile ? 'touch-target-secondary' : ''}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}