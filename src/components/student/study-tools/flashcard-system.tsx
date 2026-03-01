"use client";

import { useState, useEffect } from 'react';
import { RotateCcw, Shuffle, Play, Pause, CheckCircle, X, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { triggerHapticFeedback } from '@/lib/utils/mobile-navigation';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  correctCount: number;
  incorrectCount: number;
  tags: string[];
}

interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  subject: string;
  createdAt: Date;
}

interface FlashcardSystemProps {
  decks: FlashcardDeck[];
  onSaveDeck: (deck: Partial<FlashcardDeck>) => void;
  onDeleteDeck: (deckId: string) => void;
  onUpdateCard: (deckId: string, card: Flashcard) => void;
  className?: string;
}

export function FlashcardSystem({
  decks,
  onSaveDeck,
  onDeleteDeck,
  onUpdateCard,
  className
}: FlashcardSystemProps) {
  const { isSimplified, isMobile } = useMobileNavigation({ className });
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    subject: '',
    cards: [{ front: '', back: '', tags: '' }]
  });

  const subjects = ['Math', 'Science', 'English', 'History', 'Geography', 'Other'];

  const handleStartStudy = (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudyMode(true);
    setStudyStats({ correct: 0, incorrect: 0 });
    if (isMobile) triggerHapticFeedback('medium');
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
    if (isMobile) triggerHapticFeedback('light');
  };

  const handleAnswer = (correct: boolean) => {
    if (!selectedDeck) return;

    const currentCard = selectedDeck.cards[currentCardIndex];
    const updatedCard = {
      ...currentCard,
      lastReviewed: new Date(),
      correctCount: correct ? currentCard.correctCount + 1 : currentCard.correctCount,
      incorrectCount: correct ? currentCard.incorrectCount : currentCard.incorrectCount + 1
    };

    onUpdateCard(selectedDeck.id, updatedCard);
    setStudyStats(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: correct ? prev.incorrect : prev.incorrect + 1
    }));

    // Move to next card
    if (currentCardIndex < selectedDeck.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // End of deck
      setIsStudyMode(false);
    }

    if (isMobile) triggerHapticFeedback(correct ? 'medium' : 'heavy');
  };

  const handleShuffle = () => {
    if (!selectedDeck) return;
    const shuffledCards = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
    setSelectedDeck({ ...selectedDeck, cards: shuffledCards });
    setCurrentCardIndex(0);
    setIsFlipped(false);
    if (isMobile) triggerHapticFeedback('light');
  };

  const handleCreateDeck = () => {
    setIsCreating(true);
    setEditForm({
      name: '',
      description: '',
      subject: subjects[0],
      cards: [{ front: '', back: '', tags: '' }]
    });
  };

  const handleSaveDeck = () => {
    const deckData = {
      name: editForm.name,
      description: editForm.description,
      subject: editForm.subject,
      cards: editForm.cards.map(card => ({
        id: Math.random().toString(36).substr(2, 9),
        front: card.front,
        back: card.back,
        subject: editForm.subject,
        difficulty: 'medium' as const,
        correctCount: 0,
        incorrectCount: 0,
        tags: card.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      })).filter(card => card.front && card.back),
      createdAt: new Date()
    };

    onSaveDeck(deckData);
    setIsCreating(false);
    if (isMobile) triggerHapticFeedback('medium');
  };

  const addCard = () => {
    setEditForm(prev => ({
      ...prev,
      cards: [...prev.cards, { front: '', back: '', tags: '' }]
    }));
  };

  const removeCard = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index)
    }));
  };

  const updateCard = (index: number, field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      cards: prev.cards.map((card, i) => 
        i === index ? { ...card, [field]: value } : card
      )
    }));
  };

  if (isSimplified) {
    // Simplified layout for primary classes (1-5)
    return (
      <div className="space-y-4">
        {/* Simple Header */}
        <Card className="bg-gradient-to-r from-teal-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Flashcards</h2>
                <p className="text-teal-100">{decks.length} decks</p>
              </div>
              <Button
                onClick={handleCreateDeck}
                className="bg-white/20 hover:bg-white/30 touch-target-primary"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {isStudyMode && selectedDeck ? (
          // Simple Study Mode
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg">{selectedDeck.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Card {currentCardIndex + 1} of {selectedDeck.cards.length}
                  </p>
                  <Progress 
                    value={((currentCardIndex + 1) / selectedDeck.cards.length) * 100} 
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="min-h-[300px] cursor-pointer active:scale-95 transition-transform"
              onClick={handleFlipCard}
            >
              <CardContent className="p-8 flex items-center justify-center text-center">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {isFlipped ? 'Answer' : 'Question'}
                  </div>
                  <div className="text-xl font-medium">
                    {isFlipped 
                      ? selectedDeck.cards[currentCardIndex]?.back 
                      : selectedDeck.cards[currentCardIndex]?.front
                    }
                  </div>
                  {!isFlipped && (
                    <p className="text-sm text-muted-foreground">Tap to reveal answer</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {isFlipped && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="destructive"
                  className="touch-target-primary h-16"
                >
                  <X className="h-6 w-6 mr-2" />
                  Wrong
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="bg-green-500 hover:bg-green-600 touch-target-primary h-16"
                >
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Correct
                </Button>
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStudyMode(false)}
                className="touch-target-primary"
              >
                Exit Study
              </Button>
              <Button
                variant="outline"
                onClick={handleShuffle}
                className="touch-target-primary"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // Simple Deck List
          <div className="grid grid-cols-1 gap-4">
            {decks.map((deck) => (
              <Card 
                key={deck.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{deck.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {deck.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{deck.subject}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {deck.cards.length} cards
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartStudy(deck)}
                      className="touch-target-primary"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Study
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Simple Create Form */}
        {isCreating && (
          <Card className="fixed inset-4 z-50 bg-white shadow-2xl overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Deck</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Deck name..."
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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

              {editForm.cards.map((card, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Card {index + 1}</span>
                    {editForm.cards.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCard(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Question (front)..."
                    value={card.front}
                    onChange={(e) => updateCard(index, 'front', e.target.value)}
                    className="touch-target-primary"
                  />
                  <Input
                    placeholder="Answer (back)..."
                    value={card.back}
                    onChange={(e) => updateCard(index, 'back', e.target.value)}
                    className="touch-target-primary"
                  />
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addCard}
                className="w-full touch-target-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveDeck}
                  className="flex-1 touch-target-primary"
                >
                  Save Deck
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
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6" />
              </div>
              <div>
                <p className="text-teal-100 text-sm">Total Decks</p>
                <p className="text-2xl font-bold">{decks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Total Cards</p>
                <p className="text-2xl font-bold">
                  {decks.reduce((sum, deck) => sum + deck.cards.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Study Sessions</p>
                <p className="text-2xl font-bold">{studyStats.correct + studyStats.incorrect}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button
              onClick={handleCreateDeck}
              className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Deck
            </Button>
          </CardContent>
        </Card>
      </div>

      {isStudyMode && selectedDeck ? (
        // Study Mode
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Study Progress */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedDeck.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{currentCardIndex + 1} / {selectedDeck.cards.length}</span>
                  </div>
                  <Progress value={((currentCardIndex + 1) / selectedDeck.cards.length) * 100} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{studyStats.correct}</p>
                    <p className="text-xs text-green-600">Correct</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{studyStats.incorrect}</p>
                    <p className="text-xs text-red-600">Incorrect</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleShuffle}
                    className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsStudyMode(false)}
                    className={`w-full ${isMobile ? 'touch-target-secondary' : ''}`}
                  >
                    Exit Study
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flashcard */}
          <div className="lg:col-span-3">
            <Card 
              className="min-h-[400px] cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={handleFlipCard}
            >
              <CardContent className="p-8 flex items-center justify-center text-center h-full">
                <div className="space-y-6 max-w-2xl">
                  <Badge variant="outline" className="text-sm">
                    {isFlipped ? 'Answer' : 'Question'}
                  </Badge>
                  
                  <div className="text-2xl font-medium leading-relaxed">
                    {isFlipped 
                      ? selectedDeck.cards[currentCardIndex]?.back 
                      : selectedDeck.cards[currentCardIndex]?.front
                    }
                  </div>
                  
                  {!isFlipped && (
                    <p className="text-muted-foreground">Click to reveal answer</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {isFlipped && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="destructive"
                  size="lg"
                  className={`h-16 ${isMobile ? 'touch-target-secondary' : ''}`}
                >
                  <X className="h-6 w-6 mr-2" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  size="lg"
                  className={`bg-green-500 hover:bg-green-600 h-16 ${isMobile ? 'touch-target-secondary' : ''}`}
                >
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Correct
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Deck Management
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{deck.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {deck.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteDeck(deck.id)}
                    className={isMobile ? 'touch-target-secondary' : ''}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{deck.subject}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {deck.cards.length} cards
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartStudy(deck)}
                      className={`flex-1 ${isMobile ? 'touch-target-secondary' : ''}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Study
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={isMobile ? 'touch-target-secondary' : ''}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Deck Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Flashcard Deck</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Deck name..."
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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

            <Textarea
              placeholder="Deck description..."
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Cards</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCard}
                  className={isMobile ? 'touch-target-secondary' : ''}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </div>

              {editForm.cards.map((card, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Card {index + 1}</span>
                      {editForm.cards.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCard(index)}
                          className={isMobile ? 'touch-target-secondary' : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Textarea
                        placeholder="Question (front)..."
                        value={card.front}
                        onChange={(e) => updateCard(index, 'front', e.target.value)}
                        rows={3}
                      />
                      <Textarea
                        placeholder="Answer (back)..."
                        value={card.back}
                        onChange={(e) => updateCard(index, 'back', e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <Input
                      placeholder="Tags (comma separated)..."
                      value={card.tags}
                      onChange={(e) => updateCard(index, 'tags', e.target.value)}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveDeck}
                className={isMobile ? 'touch-target-secondary' : ''}
              >
                Save Deck
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