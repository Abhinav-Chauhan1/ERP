"use client";

import { ReactNode, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Settings, 
  Trash2, 
  GripVertical, 
  BarChart3, 
  PieChart, 
  Activity, 
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Edit
} from "lucide-react";

// Widget types and interfaces
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'alert';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  visible: boolean;
  refreshInterval?: number; // in seconds
  lastUpdated?: Date;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  columns: number;
  createdAt: Date;
  updatedAt: Date;
}

// Widget Templates
export const widgetTemplates = {
  metric: {
    type: 'metric' as const,
    title: 'Metric Widget',
    description: 'Display a single metric value',
    defaultSize: { width: 2, height: 1 },
    icon: TrendingUp,
    configFields: [
      { key: 'metric', label: 'Metric', type: 'select', required: true },
      { key: 'format', label: 'Format', type: 'select', options: ['number', 'currency', 'percentage'] },
      { key: 'showTrend', label: 'Show Trend', type: 'boolean' },
    ]
  },
  chart: {
    type: 'chart' as const,
    title: 'Chart Widget',
    description: 'Display data in various chart formats',
    defaultSize: { width: 4, height: 3 },
    icon: BarChart3,
    configFields: [
      { key: 'chartType', label: 'Chart Type', type: 'select', options: ['line', 'bar', 'pie', 'area'], required: true },
      { key: 'dataSource', label: 'Data Source', type: 'select', required: true },
      { key: 'timeRange', label: 'Time Range', type: 'select', options: ['7d', '30d', '90d', '1y'] },
    ]
  },
  table: {
    type: 'table' as const,
    title: 'Table Widget',
    description: 'Display data in a tabular format',
    defaultSize: { width: 6, height: 4 },
    icon: Users,
    configFields: [
      { key: 'dataSource', label: 'Data Source', type: 'select', required: true },
      { key: 'columns', label: 'Columns', type: 'multiselect', required: true },
      { key: 'pageSize', label: 'Page Size', type: 'number', default: 10 },
    ]
  },
  alert: {
    type: 'alert' as const,
    title: 'Alert Widget',
    description: 'Display system alerts and notifications',
    defaultSize: { width: 3, height: 2 },
    icon: AlertTriangle,
    configFields: [
      { key: 'alertType', label: 'Alert Type', type: 'select', options: ['all', 'critical', 'warning', 'info'] },
      { key: 'maxItems', label: 'Max Items', type: 'number', default: 5 },
    ]
  }
} as const;

// Drag and Drop Context
interface DragState {
  isDragging: boolean;
  draggedWidget: DashboardWidget | null;
  dragOffset: { x: number; y: number };
}

// Dashboard Builder Component
interface DashboardBuilderProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onSave?: () => void;
  isEditing?: boolean;
  className?: string;
}

export function DashboardBuilder({
  layout,
  onLayoutChange,
  onSave,
  isEditing = false,
  className,
}: DashboardBuilderProps) {
  const [editMode, setEditMode] = useState(isEditing);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedWidget: null,
    dragOffset: { x: 0, y: 0 }
  });

  // Grid configuration
  const gridSize = 100; // pixels per grid unit
  const columns = layout.columns || 12;

  // Calculate grid positions
  const getGridPosition = (x: number, y: number) => ({
    left: x * gridSize,
    top: y * gridSize,
  });

  const getGridSize = (width: number, height: number) => ({
    width: width * gridSize - 8, // Account for gaps
    height: height * gridSize - 8,
  });

  // Widget management
  const addWidget = useCallback((templateKey: keyof typeof widgetTemplates, config: Record<string, any>) => {
    const template = widgetTemplates[templateKey];
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: template.type,
      title: config.title || template.title,
      description: config.description,
      position: {
        x: 0,
        y: 0,
        width: template.defaultSize.width,
        height: template.defaultSize.height,
      },
      config,
      visible: true,
    };

    // Find available position
    const occupiedPositions = layout.widgets.map(w => w.position);
    let placed = false;
    
    for (let y = 0; y < 20 && !placed; y++) {
      for (let x = 0; x <= columns - newWidget.position.width && !placed; x++) {
        const wouldOverlap = occupiedPositions.some(pos => 
          x < pos.x + pos.width &&
          x + newWidget.position.width > pos.x &&
          y < pos.y + pos.height &&
          y + newWidget.position.height > pos.y
        );
        
        if (!wouldOverlap) {
          newWidget.position.x = x;
          newWidget.position.y = y;
          placed = true;
        }
      }
    }

    onLayoutChange({
      ...layout,
      widgets: [...layout.widgets, newWidget],
      updatedAt: new Date(),
    });
    setShowAddWidget(false);
  }, [layout, onLayoutChange, columns]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    onLayoutChange({
      ...layout,
      widgets: layout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date(),
    });
  }, [layout, onLayoutChange]);

  const removeWidget = useCallback((widgetId: string) => {
    onLayoutChange({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date(),
    });
  }, [layout, onLayoutChange]);

  const duplicateWidget = useCallback((widget: DashboardWidget) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}`,
      title: `${widget.title} (Copy)`,
      position: {
        ...widget.position,
        x: Math.min(widget.position.x + 1, columns - widget.position.width),
        y: widget.position.y + 1,
      },
    };

    onLayoutChange({
      ...layout,
      widgets: [...layout.widgets, newWidget],
      updatedAt: new Date(),
    });
  }, [layout, onLayoutChange, columns]);

  // Drag and drop handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, widget: DashboardWidget) => {
    if (!editMode) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragState({
      isDragging: true,
      draggedWidget: widget,
      dragOffset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    });
  }, [editMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedWidget) return;

    const containerRect = e.currentTarget.getBoundingClientRect();
    const newX = Math.round((e.clientX - containerRect.left - dragState.dragOffset.x) / gridSize);
    const newY = Math.round((e.clientY - containerRect.top - dragState.dragOffset.y) / gridSize);

    // Constrain to grid bounds
    const constrainedX = Math.max(0, Math.min(newX, columns - dragState.draggedWidget.position.width));
    const constrainedY = Math.max(0, newY);

    updateWidget(dragState.draggedWidget.id, {
      position: {
        ...dragState.draggedWidget.position,
        x: constrainedX,
        y: constrainedY,
      },
    });
  }, [dragState, gridSize, columns, updateWidget]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedWidget: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  // Render widget content based on type
  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold">1,234</div>
            <div className="text-sm text-muted-foreground">Sample Metric</div>
            {widget.config.showTrend && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="h-3 w-3" />
                +12%
              </div>
            )}
          </div>
        );
      case 'chart':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <div className="text-sm">{widget.config.chartType} Chart</div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <div>Name</div>
              <div>Value</div>
              <div>Status</div>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 text-xs">
                <div>Item {i + 1}</div>
                <div>123</div>
                <div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            ))}
          </div>
        );
      case 'alert':
        return (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                <span>Sample alert {i + 1}</span>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-sm">Widget Content</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{layout.name}</h2>
          {layout.description && (
            <p className="text-sm text-muted-foreground">{layout.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editMode ? 'Exit Edit' : 'Edit'}
          </Button>
          {editMode && (
            <>
              <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                    <DialogDescription>
                      Choose a widget type to add to your dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(widgetTemplates).map(([key, template]) => {
                      const Icon = template.icon;
                      return (
                        <Card 
                          key={key}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addWidget(key as keyof typeof widgetTemplates, {})}
                        >
                          <CardContent className="flex flex-col items-center p-4">
                            <Icon className="h-8 w-8 mb-2" />
                            <h3 className="font-medium">{template.title}</h3>
                            <p className="text-xs text-muted-foreground text-center">
                              {template.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
              {onSave && (
                <Button size="sm" onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div 
        className="relative bg-muted/20 rounded-lg p-4 min-h-96"
        style={{ 
          backgroundImage: editMode ? `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          ` : undefined,
          backgroundSize: editMode ? `${gridSize}px ${gridSize}px` : undefined,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {layout.widgets.filter(w => w.visible).map((widget) => (
          <div
            key={widget.id}
            className={cn(
              'absolute transition-all duration-200',
              editMode && 'cursor-move hover:shadow-lg',
              dragState.draggedWidget?.id === widget.id && 'z-10 shadow-xl'
            )}
            style={{
              ...getGridPosition(widget.position.x, widget.position.y),
              ...getGridSize(widget.position.width, widget.position.height),
            }}
            onMouseDown={(e) => handleMouseDown(e, widget)}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editMode && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    )}
                    <CardTitle className="text-sm">{widget.title}</CardTitle>
                  </div>
                  {editMode && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setSelectedWidget(widget)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => duplicateWidget(widget)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateWidget(widget.id, { visible: !widget.visible })}
                      >
                        {widget.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => removeWidget(widget.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {widget.description && (
                  <CardDescription className="text-xs">{widget.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                {renderWidgetContent(widget)}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Widget Configuration Dialog */}
      <Dialog open={!!selectedWidget} onOpenChange={() => setSelectedWidget(null)}>
        <DialogContent>
          {selectedWidget && (
            <>
              <DialogHeader>
                <DialogTitle>Configure Widget</DialogTitle>
                <DialogDescription>
                  Customize the settings for {selectedWidget.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={selectedWidget.title}
                    onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={selectedWidget.description || ''}
                    onChange={(e) => updateWidget(selectedWidget.id, { description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      max={columns}
                      value={selectedWidget.position.width}
                      onChange={(e) => updateWidget(selectedWidget.id, {
                        position: {
                          ...selectedWidget.position,
                          width: parseInt(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      value={selectedWidget.position.height}
                      onChange={(e) => updateWidget(selectedWidget.id, {
                        position: {
                          ...selectedWidget.position,
                          height: parseInt(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedWidget(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setSelectedWidget(null)}>
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Dashboard Preview Component
interface DashboardPreviewProps {
  layout: DashboardLayout;
  className?: string;
}

export function DashboardPreview({ layout, className }: DashboardPreviewProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="font-medium">{layout.name}</h3>
        {layout.description && (
          <p className="text-sm text-muted-foreground">{layout.description}</p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {layout.widgets.slice(0, 8).map((widget) => (
          <div key={widget.id} className="aspect-square bg-muted rounded border">
            <div className="p-2 text-xs">
              <div className="font-medium truncate">{widget.title}</div>
              <div className="text-muted-foreground">{widget.type}</div>
            </div>
          </div>
        ))}
        {layout.widgets.length > 8 && (
          <div className="aspect-square bg-muted rounded border flex items-center justify-center">
            <div className="text-xs text-muted-foreground">
              +{layout.widgets.length - 8} more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}