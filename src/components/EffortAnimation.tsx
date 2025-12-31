import React, { useEffect, useState } from 'react';
import { Flower, Star, Sparkles } from 'lucide-react';

interface EffortAnimationProps {
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  icon: 'flower' | 'star' | 'sparkle';
  onComplete: () => void;
}

const EffortAnimation: React.FC<EffortAnimationProps> = ({
  startPosition,
  endPosition,
  icon,
  onComplete,
}) => {
  const [position, setPosition] = useState(startPosition);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const duration = 1000; // 1 second
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startPosition.x + (endPosition.x - startPosition.x) * easeOut;
      const currentY = startPosition.y + (endPosition.y - startPosition.y) * easeOut;
      
      setPosition({ x: currentX, y: currentY });
      setScale(1 + (0.2 * progress) - (0.5 * progress)); // Scale up then down
      setOpacity(1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }, [startPosition, endPosition, onComplete]);

  const getIcon = () => {
    const iconClass = "w-6 h-6 text-primary";
    switch (icon) {
      case 'star':
        return <Star className={iconClass} />;
      case 'sparkle':
        return <Sparkles className={iconClass} />;
      case 'flower':
      default:
        return <Flower className={iconClass} />;
    }
  };

  if (opacity <= 0) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: opacity,
        transition: 'none',
      }}
    >
      {getIcon()}
    </div>
  );
};

export default EffortAnimation;

