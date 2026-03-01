"use client";

import { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target, Award, Medal, Crown, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { triggerHapticFeedback } from '@/lib/utils/mobile-navigation';
import { getStudentAchievements, unlockAchievement, Achievement, StudentStats } from '@/lib/actions/student-achievements-actions';
import { toast } from 'sonner';

interface AchievementSystemProps {
  className?: string;
}

export function AchievementSystem({
  className
}: AchievementSystemProps) {
  const { isSimplified, isMobile } = useMobileNavigation({ className });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load achievements and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getStudentAchievements();
        setAchievements(result.achievements);
        setStats(result.stats);
      } catch (error) {
        console.error('Error loading achievements:', error);
        toast.error('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleClaimReward = async (achievementId: string) => {
    try {
      triggerHapticFeedback('light');
      const result = await unlockAchievement(achievementId);

      if (result.success) {
        toast.success(`Achievement unlocked! +${result.points} XP`);
        // Reload data to get updated achievements and stats
        const updatedResult = await getStudentAchievements();
        setAchievements(updatedResult.achievements);
        setStats(updatedResult.stats);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    }
  };
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'ACADEMIC', label: 'Academic', icon: Star },
    { id: 'ATTENDANCE', label: 'Attendance', icon: Target },
    { id: 'PARTICIPATION', label: 'Participation', icon: Zap },
    { id: 'STREAK', label: 'Streaks', icon: Flame },
    { id: 'SPECIAL', label: 'Special', icon: Crown }
  ];

  const getAchievementIcon = (iconName: string) => {
    const icons = {
      Trophy, Star, Zap, Target, Award, Medal, Crown, Flame
    };
    return icons[iconName as keyof typeof icons] || Trophy;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const unlockedMatch = !showUnlockedOnly || achievement.unlocked;
    return categoryMatch && unlockedMatch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Failed to load achievements</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSimplified) {
    // Simplified layout for primary classes (1-5)
    return (
      <div className="space-y-4">
        {/* Simple Stats */}
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Level {stats.level}</h2>
                <p className="text-yellow-100">⭐ {stats.totalXP} XP</p>
              </div>
              <div className="text-right">
                <div className="text-3xl">🏆</div>
                <p className="text-sm">{stats.unlockedAchievements} Badges</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress
                value={(stats.currentLevelXP / (stats.currentLevelXP + stats.xpToNextLevel)) * 100}
                className="bg-white/20"
              />
              <p className="text-xs mt-1 text-yellow-100">
                {stats.xpToNextLevel} XP to next level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Simple Achievement Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredAchievements.slice(0, 8).map((achievement) => {
            const Icon = getAchievementIcon(achievement.icon);
            return (
              <Card
                key={achievement.id}
                className={`
                  relative overflow-hidden transition-all duration-200
                  ${achievement.unlocked
                    ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                  }
                  ${isMobile ? 'active:scale-95' : 'hover:scale-105'}
                `}
              >
                <CardContent className="p-4 text-center">
                  <div className={`
                    w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center
                    ${achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'}
                  `}>
                    <Icon className={`h-6 w-6 ${achievement.unlocked ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>

                  <h3 className="font-semibold text-sm mb-1">{achievement.title}</h3>

                  {achievement.unlocked ? (
                    <Badge className="bg-green-500 text-white text-xs">
                      +{achievement.points} XP
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                      {achievement.progress >= achievement.maxProgress && (
                        <Button
                          size="sm"
                          className="w-full mt-1 text-xs py-1 h-6"
                          onClick={() => handleClaimReward(achievement.id)}
                        >
                          Claim!
                        </Button>
                      )}
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Simple View All Button */}
        <Button
          variant="outline"
          className="w-full touch-target-primary"
          onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
        >
          {showUnlockedOnly ? 'Show All Badges' : 'Show My Badges Only'}
        </Button>
      </div>
    );
  }

  // Full layout for secondary classes (6-12)
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Level</p>
                <p className="text-2xl font-bold">{stats.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-yellow-100 text-sm">Total XP</p>
                <p className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Streak</p>
                <p className="text-2xl font-bold">{stats.streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-teal-100 text-sm">Achievements</p>
                <p className="text-2xl font-bold">{stats.unlockedAchievements}/{stats.totalAchievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Level {stats.level} Progress</h3>
              <p className="text-sm text-muted-foreground">
                {stats.xpToNextLevel} XP needed for Level {stats.level + 1}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {stats.currentLevelXP} / {stats.currentLevelXP + stats.xpToNextLevel} XP
            </Badge>
          </div>
          <Progress
            value={(stats.currentLevelXP / (stats.currentLevelXP + stats.xpToNextLevel)) * 100}
            className="h-3"
          />
        </CardContent>
      </Card>

      {/* Category Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    if (isMobile) triggerHapticFeedback('light');
                  }}
                  className={`${isMobile ? 'touch-target-secondary' : ''} flex items-center gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={isMobile ? 'touch-target-secondary' : ''}
            >
              {showUnlockedOnly ? 'Show All' : 'Show Unlocked Only'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const Icon = getAchievementIcon(achievement.icon);
              return (
                <Card
                  key={achievement.id}
                  className={`
                    relative overflow-hidden transition-all duration-200
                    ${achievement.unlocked
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-blue-50'
                      : 'border-gray-200 bg-gray-50/50'
                    }
                    ${isMobile ? 'active:scale-95' : 'hover:scale-105'}
                  `}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                        ${achievement.unlocked
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm">{achievement.title}</h4>
                          {achievement.unlocked && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {achievement.description}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRarityColor(achievement.rarity)}`}
                          >
                            {achievement.rarity}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            +{achievement.points} XP
                          </Badge>
                        </div>

                        {!achievement.unlocked && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">
                                {achievement.progress}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress
                              value={(achievement.progress / achievement.maxProgress) * 100}
                              className="h-2"
                            />
                            {achievement.progress >= achievement.maxProgress && (
                              <Button
                                size="sm"
                                className="w-full mt-2 touch-target-secondary"
                                onClick={() => handleClaimReward(achievement.id)}
                              >
                                Claim Reward
                              </Button>
                            )}
                          </div>
                        )}

                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No achievements found in this category.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}