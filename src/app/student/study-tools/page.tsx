"use client"

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteTakingApp } from '@/components/student/study-tools/note-taking-app';
import { FlashcardSystem } from '@/components/student/study-tools/flashcard-system';
import { MindMapCreator } from '@/components/student/study-tools/mind-map-creator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, RotateCcw, Lightbulb } from 'lucide-react';

// Mock data - replace with actual data fetching
const mockNotes = [
  {
    id: 'note-1',
    title: 'Photosynthesis Process',
    content: 'Photosynthesis is the process by which plants make their own food using sunlight, water, and carbon dioxide. The process occurs in chloroplasts and produces glucose and oxygen as byproducts.',
    subject: 'Science',
    tags: ['biology', 'plants', 'energy'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    folder: 'Biology'
  },
  {
    id: 'note-2',
    title: 'Algebra Basics',
    content: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols. Variables represent unknown quantities, and equations show relationships between variables.',
    subject: 'Math',
    tags: ['algebra', 'equations', 'variables'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    folder: 'Mathematics'
  },
  {
    id: 'note-3',
    title: 'World War II Timeline',
    content: 'World War II lasted from 1939 to 1945. Key events include the invasion of Poland (1939), Pearl Harbor attack (1941), D-Day landings (1944), and the atomic bombs on Japan (1945).',
    subject: 'History',
    tags: ['wwii', 'timeline', 'events'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22')
  }
];

const mockFlashcardDecks = [
  {
    id: 'deck-1',
    name: 'Math Formulas',
    description: 'Essential mathematical formulas for algebra and geometry',
    subject: 'Math',
    createdAt: new Date('2024-01-10'),
    cards: [
      {
        id: 'card-1',
        front: 'What is the quadratic formula?',
        back: 'x = (-b ± √(b² - 4ac)) / 2a',
        subject: 'Math',
        difficulty: 'medium' as const,
        correctCount: 5,
        incorrectCount: 2,
        tags: ['algebra', 'quadratic']
      },
      {
        id: 'card-2',
        front: 'What is the area of a circle?',
        back: 'A = πr²',
        subject: 'Math',
        difficulty: 'easy' as const,
        correctCount: 8,
        incorrectCount: 1,
        tags: ['geometry', 'circle']
      },
      {
        id: 'card-3',
        front: 'What is the Pythagorean theorem?',
        back: 'a² + b² = c²',
        subject: 'Math',
        difficulty: 'easy' as const,
        correctCount: 10,
        incorrectCount: 0,
        tags: ['geometry', 'triangle']
      }
    ]
  },
  {
    id: 'deck-2',
    name: 'Science Vocabulary',
    description: 'Important scientific terms and definitions',
    subject: 'Science',
    createdAt: new Date('2024-01-15'),
    cards: [
      {
        id: 'card-4',
        front: 'What is photosynthesis?',
        back: 'The process by which plants use sunlight, water, and CO2 to make glucose and oxygen',
        subject: 'Science',
        difficulty: 'medium' as const,
        correctCount: 3,
        incorrectCount: 1,
        tags: ['biology', 'plants']
      },
      {
        id: 'card-5',
        front: 'What is gravity?',
        back: 'A force that attracts objects toward each other, especially toward the center of the Earth',
        subject: 'Science',
        difficulty: 'easy' as const,
        correctCount: 6,
        incorrectCount: 0,
        tags: ['physics', 'force']
      }
    ]
  }
];

const mockMindMaps = [
  {
    id: 'mindmap-1',
    title: 'Solar System',
    subject: 'Science',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-20'),
    nodes: [
      {
        id: 'root',
        text: 'Solar System',
        x: 400,
        y: 300,
        color: '#3B82F6',
        isRoot: true,
        children: ['planets', 'sun', 'asteroids']
      },
      {
        id: 'planets',
        text: 'Planets',
        x: 300,
        y: 200,
        color: '#10B981',
        isRoot: false,
        parentId: 'root',
        children: ['inner', 'outer']
      },
      {
        id: 'sun',
        text: 'Sun',
        x: 500,
        y: 200,
        color: '#F59E0B',
        isRoot: false,
        parentId: 'root',
        children: []
      },
      {
        id: 'asteroids',
        text: 'Asteroids',
        x: 400,
        y: 400,
        color: '#14B8A6',
        isRoot: false,
        parentId: 'root',
        children: []
      },
      {
        id: 'inner',
        text: 'Inner Planets',
        x: 200,
        y: 150,
        color: '#EF4444',
        isRoot: false,
        parentId: 'planets',
        children: []
      },
      {
        id: 'outer',
        text: 'Outer Planets',
        x: 200,
        y: 250,
        color: '#06B6D4',
        isRoot: false,
        parentId: 'planets',
        children: []
      }
    ],
    connections: [
      { from: 'root', to: 'planets' },
      { from: 'root', to: 'sun' },
      { from: 'root', to: 'asteroids' },
      { from: 'planets', to: 'inner' },
      { from: 'planets', to: 'outer' }
    ]
  }
];

function StudyToolsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="space-y-4">
        <div className="flex space-x-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StudyToolsPage() {
  const handleSaveNote = (note: any) => {
    console.log('Saving note:', note);
    // In a real app, you would save to database
  };

  const handleDeleteNote = (noteId: string) => {
    console.log('Deleting note:', noteId);
    // In a real app, you would delete from database
  };

  const handleSaveDeck = (deck: any) => {
    console.log('Saving flashcard deck:', deck);
    // In a real app, you would save to database
  };

  const handleDeleteDeck = (deckId: string) => {
    console.log('Deleting flashcard deck:', deckId);
    // In a real app, you would delete from database
  };

  const handleUpdateCard = (deckId: string, card: any) => {
    console.log('Updating card:', deckId, card);
    // In a real app, you would update card statistics
  };

  const handleSaveMindMap = (mindMap: any) => {
    console.log('Saving mind map:', mindMap);
    // In a real app, you would save to database
  };

  const handleDeleteMindMap = (mindMapId: string) => {
    console.log('Deleting mind map:', mindMapId);
    // In a real app, you would delete from database
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Study Tools</h1>
        <p className="text-muted-foreground">
          Organize your learning with notes, flashcards, and mind maps
        </p>
      </div>

      <Suspense fallback={<StudyToolsSkeleton />}>
        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="mindmaps" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Mind Maps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            <NoteTakingApp
              notes={mockNotes}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-6">
            <FlashcardSystem
              decks={mockFlashcardDecks}
              onSaveDeck={handleSaveDeck}
              onDeleteDeck={handleDeleteDeck}
              onUpdateCard={handleUpdateCard}
            />
          </TabsContent>

          <TabsContent value="mindmaps" className="space-y-6">
            <MindMapCreator
              mindMaps={mockMindMaps}
              onSaveMindMap={handleSaveMindMap}
              onDeleteMindMap={handleDeleteMindMap}
            />
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}