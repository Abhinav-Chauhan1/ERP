"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Tag,
  User,
  Calendar,
  TrendingUp,
  FileText,
  Globe,
  Lock,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface KBMetrics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  averageViews: number;
  categoryCounts: Record<string, number>;
  topArticles: Array<{
    id: string;
    title: string;
    viewCount: number;
  }>;
}

export function KnowledgeBaseManagement() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [metrics, setMetrics] = useState<KBMetrics | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for creating/editing articles
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    isPublished: false
  });

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    loadArticles();
    loadMetrics();
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockArticles: KnowledgeBaseArticle[] = [
      {
        id: "article_1",
        title: "How to Reset Student Passwords",
        content: `# How to Reset Student Passwords

This guide explains how to reset student passwords in the system.

## Steps:

1. Navigate to the Students section
2. Find the student whose password needs to be reset
3. Click on the student's profile
4. Click "Reset Password" button
5. A temporary password will be generated and sent to the student's email

## Important Notes:

- Students will be required to change their password on first login
- Temporary passwords expire after 24 hours
- Make sure the student's email address is correct before resetting

## Troubleshooting:

If the password reset email is not received:
- Check the spam folder
- Verify the email address is correct
- Contact IT support if the issue persists`,
        category: "User Management",
        tags: ["password", "students", "reset", "troubleshooting"],
        isPublished: true,
        viewCount: 245,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        author: {
          id: "admin_1",
          name: "Sarah Johnson",
          email: "sarah.johnson@company.com"
        }
      },
      {
        id: "article_2",
        title: "Setting Up Grade Calculations",
        content: `# Setting Up Grade Calculations

Learn how to configure grade calculations for different subjects and assessment types.

## Overview:

The grade calculation system supports multiple grading schemes including:
- Percentage-based grading
- Point-based grading
- Letter grades
- Custom grading scales

## Configuration Steps:

1. Go to Academic Settings
2. Select "Grade Calculations"
3. Choose your grading scheme
4. Set up weight distributions for different assessment types
5. Configure grade boundaries if using letter grades

## Best Practices:

- Always test your grade calculations with sample data
- Communicate grading policies clearly to students and parents
- Regular backup of grade calculation settings`,
        category: "Academic Management",
        tags: ["grades", "calculations", "setup", "academic"],
        isPublished: true,
        viewCount: 189,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        author: {
          id: "admin_2",
          name: "Mike Wilson",
          email: "mike.wilson@company.com"
        }
      },
      {
        id: "article_3",
        title: "Billing and Payment Troubleshooting",
        content: `# Billing and Payment Troubleshooting

Common billing issues and their solutions.

## Common Issues:

### Payment Failed
- Check if the credit card is expired
- Verify billing address matches card details
- Ensure sufficient funds are available

### Invoice Not Generated
- Check if the billing cycle is configured correctly
- Verify school subscription status
- Contact billing support if issue persists

### Refund Requests
- Refunds can be processed within 30 days of payment
- Partial refunds are available for mid-cycle cancellations
- Processing time is 5-7 business days`,
        category: "Billing",
        tags: ["billing", "payment", "troubleshooting", "refunds"],
        isPublished: false,
        viewCount: 67,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        author: {
          id: "admin_1",
          name: "Sarah Johnson",
          email: "sarah.johnson@company.com"
        }
      },
      {
        id: "article_4",
        title: "System Maintenance Schedule",
        content: `# System Maintenance Schedule

Information about regular system maintenance and updates.

## Scheduled Maintenance:

- **Weekly**: Every Sunday 2:00 AM - 4:00 AM EST
- **Monthly**: First Saturday of each month 10:00 PM - 2:00 AM EST
- **Quarterly**: Major updates and feature releases

## What to Expect:

During maintenance windows:
- System may be temporarily unavailable
- Data backup and integrity checks
- Security updates and patches
- Performance optimizations

## Notifications:

- Email notifications sent 48 hours in advance
- In-app notifications 24 hours before maintenance
- Status page updates during maintenance`,
        category: "System Information",
        tags: ["maintenance", "schedule", "updates", "notifications"],
        isPublished: true,
        viewCount: 156,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        author: {
          id: "admin_3",
          name: "Lisa Chen",
          email: "lisa.chen@company.com"
        }
      }
    ];

    setArticles(mockArticles);
    setIsLoading(false);
  };

  const loadMetrics = async () => {
    // Simulate API call
    const mockMetrics: KBMetrics = {
      totalArticles: 24,
      publishedArticles: 18,
      draftArticles: 6,
      totalViews: 3456,
      averageViews: 144,
      categoryCounts: {
        "User Management": 8,
        "Academic Management": 6,
        "Billing": 4,
        "System Information": 3,
        "Technical Support": 3
      },
      topArticles: [
        { id: "article_1", title: "How to Reset Student Passwords", viewCount: 245 },
        { id: "article_2", title: "Setting Up Grade Calculations", viewCount: 189 },
        { id: "article_4", title: "System Maintenance Schedule", viewCount: 156 }
      ]
    };

    setMetrics(mockMetrics);
  };

  const categories = [
    "User Management",
    "Academic Management", 
    "Billing",
    "System Information",
    "Technical Support",
    "Getting Started"
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && article.isPublished) ||
                         (statusFilter === "draft" && !article.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateArticle = async () => {
    // Simulate API call
    console.log("Creating article:", formData);
    
    // Reset form
    setFormData({
      title: "",
      content: "",
      category: "",
      tags: "",
      isPublished: false
    });
    
    setShowCreateDialog(false);
    await loadArticles();
    await loadMetrics();
  };

  const handleEditArticle = async () => {
    if (!selectedArticle) return;
    
    // Simulate API call
    console.log("Updating article:", selectedArticle.id, formData);
    
    setIsEditing(false);
    setShowArticleDialog(false);
    await loadArticles();
    await loadMetrics();
  };

  const handleDeleteArticle = async (articleId: string) => {
    // Simulate API call
    console.log("Deleting article:", articleId);
    await loadArticles();
    await loadMetrics();
  };

  const handleTogglePublish = async (articleId: string, isPublished: boolean) => {
    // Simulate API call
    console.log(`${isPublished ? 'Publishing' : 'Unpublishing'} article:`, articleId);
    await loadArticles();
    await loadMetrics();
  };

  const openEditDialog = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(", "),
      isPublished: article.isPublished
    });
    setIsEditing(true);
    setShowArticleDialog(true);
  };

  const openViewDialog = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setIsEditing(false);
    setShowArticleDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base Management</h2>
          <p className="text-muted-foreground">
            Create and manage help articles and documentation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadArticles}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Knowledge Base Article</DialogTitle>
                <DialogDescription>
                  Create a new help article for the knowledge base
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      placeholder="Article title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    placeholder="Enter tags separated by commas"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    placeholder="Article content (Markdown supported)"
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="published">
                    Publish immediately
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateArticle}>
                    Create Article
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalArticles}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.publishedArticles} published, {metrics.draftArticles} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {metrics.averageViews} views per article
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
              <Globe className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.publishedArticles}</div>
              <p className="text-xs text-muted-foreground">
                {((metrics.publishedArticles / metrics.totalArticles) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Articles</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.draftArticles}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting publication
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Articles */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topArticles.map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{article.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {article.viewCount} views
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Articles ({filteredArticles.length})</CardTitle>
          <CardDescription>
            Manage help articles and documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading articles...</span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No articles found matching your filters
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div key={article.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{article.title}</h4>
                        <Badge variant="outline">{article.category}</Badge>
                        {article.isPublished ? (
                          <Badge variant="default" className="bg-green-600">
                            <Globe className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.content.substring(0, 200)}...
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {article.author.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(article.createdAt, 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.viewCount} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {article.tags.length} tags
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(article)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(article)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(article.id, !article.isPublished)}>
                            {article.isPublished ? (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Globe className="h-4 w-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Article Detail/Edit Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isEditing ? "Edit Article" : selectedArticle.title}
                  {!isEditing && (
                    <>
                      <Badge variant="outline">{selectedArticle.category}</Badge>
                      {selectedArticle.isPublished ? (
                        <Badge variant="default" className="bg-green-600">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {isEditing ? "Edit the knowledge base article" : `${selectedArticle.viewCount} views • Created ${format(selectedArticle.createdAt, 'MMM dd, yyyy')}`}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {isEditing ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea 
                        rows={12}
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="published-edit"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="published-edit">
                        Published
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditArticle}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    {/* Article Meta */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Author</Label>
                        <div>{selectedArticle.author.name}</div>
                      </div>
                      <div>
                        <Label>Last Updated</Label>
                        <div>{format(selectedArticle.updatedAt, 'MMM dd, yyyy HH:mm')}</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedArticle.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <Label>Content</Label>
                      <div className="mt-2 p-4 bg-muted rounded-md">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {selectedArticle.content}
                        </pre>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => openEditDialog(selectedArticle)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Article
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}