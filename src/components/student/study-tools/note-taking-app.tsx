"use client";

import { useState, useEffect } from 'react';
import { Save, Plus, Search, BookOpen, Edit3, Trash2, FolderPlus, Folder } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { triggerHapticFeedback } from '@/lib/utils/mobile-navigation';

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  folder?: string;
}

interface NoteTakingAppProps {
  notes: Note[];
  onSaveNote: (note: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  className?: string;
}

export function NoteTakingApp({
  notes,
  onSaveNote,
  onDeleteNote,
  className
}: NoteTakingAppProps) {
  const { isSimplified, isMobile } = useMobileNavigation({ className });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    subject: '',
    tags: '',
    folder: ''
  });

  const subjects = ['Math', 'Science', 'English', 'History', 'Geography', 'Other'];
  const folders = ['all', ...Array.from(new Set(notes.map(n => n.folder).filter(Boolean)))];

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder === 'all' || note.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleNewNote = () => {
    setSelectedNote(null);
    setIsEditing(true);
    setEditForm({
      title: '',
      content: '',
      subject: subjects[0],
      tags: '',
      folder: ''
    });
    if (isMobile) triggerHapticFeedback('light');
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditForm({
      title: note.title,
      content: note.content,
      subject: note.subject,
      tags: note.tags.join(', '),
      folder: note.folder || ''
    });
    if (isMobile) triggerHapticFeedback('light');
  };

  const handleSaveNote = () => {
    const noteData = {
      ...selectedNote,
      title: editForm.title,
      content: editForm.content,
      subject: editForm.subject,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      folder: editForm.folder || undefined,
      updatedAt: new Date()
    };

    if (!selectedNote) {
      noteData.createdAt = new Date();
    }

    onSaveNote(noteData);
    setIsEditing(false);
    setSelectedNote(null);
    if (isMobile) triggerHapticFeedback('medium');
  };

  const handleDeleteNote = (noteId: string) => {
    onDeleteNote(noteId);
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
    if (isMobile) triggerHapticFeedback('medium');
  };

  if (isSimplified) {
    // Simplified layout for primary classes (1-5)
    return (
      <div className="space-y-4">
        {/* Simple Header */}
        <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">My Notes</h2>
                <p className="text-green-100">{notes.length} notes</p>
              </div>
              <Button
                onClick={handleNewNote}
                className="bg-white/20 hover:bg-white/30 touch-target-primary"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simple Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 touch-target-primary"
          />
        </div>

        {/* Simple Notes Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.slice(0, 6).map((note) => (
            <Card 
              key={note.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedNote(note);
                if (isMobile) triggerHapticFeedback('light');
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {note.subject}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditNote(note);
                    }}
                    className="touch-target-primary"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Simple Editor Modal */}
        {isEditing && (
          <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
            <CardHeader>
              <CardTitle>
                {selectedNote ? 'Edit Note' : 'New Note'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Note title..."
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="touch-target-primary"
              />
              
              <select
                value={editForm.subject}
                onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full p-3 border rounded-lg touch-target-primary"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <Textarea
                placeholder="Write your note here..."
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="touch-target-primary"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveNote}
                  className="flex-1 touch-target-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 touch-target-primary"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simple Note Viewer */}
        {selectedNote && !isEditing && (
          <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedNote.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditNote(selectedNote)}
                    className="touch-target-primary"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNote(null)}
                    className="touch-target-primary"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedNote.subject}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedNote.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
                {selectedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedNote.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Full layout for secondary classes (6-12)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Notes Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notes</CardTitle>
              <Button
                size="sm"
                onClick={handleNewNote}
                className={isMobile ? 'touch-target-secondary' : ''}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Folder Filter */}
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
            >
              {folders.map(folder => (
                <option key={folder} value={folder}>
                  {folder === 'all' ? 'All Notes' : folder}
                </option>
              ))}
            </select>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsEditing(false);
                  if (isMobile) triggerHapticFeedback('light');
                }}
                className={`
                  w-full p-3 rounded-lg text-left transition-all duration-200
                  ${selectedNote?.id === note.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                  }
                  ${isMobile ? 'touch-target-secondary' : ''}
                `}
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm truncate">{note.title}</p>
                  <p className="text-xs opacity-75 line-clamp-2">{note.content}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {note.subject}
                    </Badge>
                    <span className="text-xs opacity-60">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            
            {filteredNotes.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notes found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedNote ? 'Edit Note' : 'New Note'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Note title..."
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <select
                  value={editForm.subject}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="p-2 border rounded-lg"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Tags (comma separated)..."
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                />
                
                <Input
                  placeholder="Folder (optional)..."
                  value={editForm.folder}
                  onChange={(e) => setEditForm(prev => ({ ...prev, folder: e.target.value }))}
                />
              </div>
              
              <Textarea
                placeholder="Write your note here..."
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveNote}
                  className={isMobile ? 'touch-target-secondary' : ''}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Note
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className={isMobile ? 'touch-target-secondary' : ''}
                >
                  Cancel
                </Button>
                {selectedNote && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className={`ml-auto ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : selectedNote ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedNote.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{selectedNote.subject}</Badge>
                    {selectedNote.folder && (
                      <Badge variant="outline">
                        <Folder className="h-3 w-3 mr-1" />
                        {selectedNote.folder}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Updated {new Date(selectedNote.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEditNote(selectedNote)}
                    className={isMobile ? 'touch-target-secondary' : ''}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className={isMobile ? 'touch-target-secondary' : ''}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{selectedNote.content}</div>
              </div>
              
              {selectedNote.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNote.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Note Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a note from the sidebar or create a new one
                </p>
                <Button onClick={handleNewNote}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Note
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}