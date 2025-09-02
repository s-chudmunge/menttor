// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useBehavioralContext } from '../../app/context/BehavioralContext';
import { useRewards } from '../../hooks/useBehavioral';
import RewardAnimations from './RewardAnimations';

interface ActiveReward {
  id: string;
  type: 'confetti' | 'achievement' | 'streak_bonus' | 'level_up' | 'milestone';
  content: any;
  timestamp: Date;
}

const RewardSystemManager: React.FC = () => {
  const { pendingRewards, behavioralStats } = useBehavioralContext();
  const { recentRewards } = useRewards();
  const [activeRewards, setActiveRewards] = useState<ActiveReward[]>([]);
  
  // Monitor behavioral events for rewards
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      setActiveRewards(prev => [...prev, {
        id: `levelup_${Date.now()}`,
        type: 'level_up',
        content: event.detail,
        timestamp: new Date()
      }]);
    };

    const handleMilestone = (event: CustomEvent) => {
      setActiveRewards(prev => [...prev, {
        id: `milestone_${Date.now()}`,
        type: 'milestone',
        content: event.detail,
        timestamp: new Date()
      }]);
    };

    const handleReward = (event: CustomEvent) => {
      const rewardType = event.detail.type || 'confetti';
      setActiveRewards(prev => [...prev, {
        id: `reward_${Date.now()}`,
        type: rewardType,
        content: event.detail,
        timestamp: new Date()
      }]);
    };

    const handleMomentumBonus = (event: CustomEvent) => {
      // Show confetti for momentum bonuses
      setActiveRewards(prev => [...prev, {
        id: `momentum_${Date.now()}`,
        type: 'confetti',
        content: { message: 'Momentum bonus!' },
        timestamp: new Date()
      }]);
    };

    window.addEventListener('levelUp', handleLevelUp as EventListener);
    window.addEventListener('milestoneCompleted', handleMilestone as EventListener);
    window.addEventListener('rewardReceived', handleReward as EventListener);
    window.addEventListener('momentumBonus', handleMomentumBonus as EventListener);

    return () => {
      window.removeEventListener('levelUp', handleLevelUp as EventListener);
      window.removeEventListener('milestoneCompleted', handleMilestone as EventListener);
      window.removeEventListener('rewardReceived', handleReward as EventListener);
      window.removeEventListener('momentumBonus', handleMomentumBonus as EventListener);
    };
  }, []);

  // Handle recent rewards from backend
  useEffect(() => {
    if (recentRewards.length > 0) {
      const latestReward = recentRewards[0];
      if (latestReward && !latestReward.engaged) {
        const rewardType = latestReward.type === 'achievement' ? 'achievement' :
                           latestReward.type === 'streak_bonus' ? 'streak_bonus' :
                           'confetti';
        
        setActiveRewards(prev => [...prev, {
          id: `backend_${latestReward.id}`,
          type: rewardType,
          content: latestReward.content,
          timestamp: new Date(latestReward.created_at)
        }]);
      }
    }
  }, [recentRewards]);

  const handleRewardComplete = (rewardId: string) => {
    setActiveRewards(prev => prev.filter(reward => reward.id !== rewardId));
  };

  return (
    <>
      {activeRewards.map(reward => (
        <RewardAnimations
          key={reward.id}
          type={reward.type}
          content={reward.content}
          isVisible={true}
          onComplete={() => handleRewardComplete(reward.id)}
        />
      ))}
    </>
  );
};

export default RewardSystemManager;