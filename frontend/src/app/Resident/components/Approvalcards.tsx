"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef, useLayoutEffect } from "react";
import { Car, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import Image from "next/image";
import { ApprovalCardsProps } from "../types/visitor";

export const ApprovalCards: React.FC<ApprovalCardsProps> = ({ items, onApprove, onDeny }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dragOffset, setDragOffset] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [lastTouchTime, setLastTouchTime] = useState<number | null>(null);
  const [lastTouchX, setLastTouchX] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [velocity, setVelocity] = useState(0);

  // Sort by smallest id first
  const sortedPending = [...items].sort((a, b) => Number(a.id) - Number(b.id));

  const nextCard = (skipCount: number = 1) => {
    const newIndex = Math.min(currentIndex + skipCount, sortedPending.length - 1);
    if (newIndex !== currentIndex && !isAnimating && cardRef.current) {
      setIsAnimating(true);
      // card out to the left
      gsap.to(cardRef.current, {
        x: -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(newIndex);
          // Reset position and animate in from right
          gsap.set(cardRef.current, { x: 100, opacity: 0 });
          gsap.to(cardRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false)
          });
        }
      });
    }
  };

  const prevCard = (skipCount: number = 1) => {
    const newIndex = Math.max(currentIndex - skipCount, 0);
    if (newIndex !== currentIndex && !isAnimating && cardRef.current) {
      setIsAnimating(true);
      // card out to the right
      gsap.to(cardRef.current, {
        x: 100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentIndex(newIndex);
          // Reset position and animate in from left
          gsap.set(cardRef.current, { x: -100, opacity: 0 });
          gsap.to(cardRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false)
          });
        }
      });
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const now = Date.now();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartTime(now);
    setLastTouchTime(now);
    setLastTouchX(e.targetTouches[0].clientX);
    setVelocity(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isAnimating) return;
    const currentTouch = e.targetTouches[0].clientX;
    const now = Date.now();
    const diff = currentTouch - touchStart;
    
    // Calculate velocity based on recent movement
    if (lastTouchTime && lastTouchX !== null) {
      const timeDiff = now - lastTouchTime;
      const distanceDiff = Math.abs(currentTouch - lastTouchX);
      if (timeDiff > 0) {
        const currentVelocity = distanceDiff / timeDiff;
        setVelocity(currentVelocity);
      }
    }
    
    setDragOffset(diff);
    setTouchEnd(currentTouch);
    setLastTouchTime(now);
    setLastTouchX(currentTouch);
    
    // Apply visual feedback that follows finger movement
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: diff * 0.4 });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isAnimating || !touchStartTime) return;
    
    const now = Date.now();
    const totalTime = now - touchStartTime;
    const diff = touchStart - touchEnd;
    
    // Calculate final velocity
    const finalVelocity = Math.abs(diff) / totalTime;
    
    // Calculate how many cards to skip based on velocity and distance
    let skipCount = 1;
    const absDiff = Math.abs(diff);
    
    if (finalVelocity > 1.5) {
      // Very fast swipe - skip multiple cards
      skipCount = Math.min(Math.floor(absDiff / 80) + 1, 5); // Max 5 cards
    } else if (finalVelocity > 1.0) {
      // Fast swipe - skip 2-3 cards
      skipCount = Math.min(Math.floor(absDiff / 100) + 1, 3);
    } else if (finalVelocity > 0.5) {
      // Medium-fast swipe - skip 1-2 cards
      skipCount = Math.min(Math.floor(absDiff / 120) + 1, 2);
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal single card
      skipCount = 1;
    } else {
      // Slow swipe - normal single card
      skipCount = 1;
    }
    
    // Dynamic thresholds based on velocity and distance
    let minDistance = 30; // Base minimum distance
    
    if (finalVelocity > 1.0) {
      // Very fast swipe - very low threshold
      minDistance = 15;
    } else if (finalVelocity > 0.5) {
      // Fast swipe - low threshold
      minDistance = 25;
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal threshold
      minDistance = 40;
    } else {
      // Slow swipe - higher threshold
      minDistance = 60;
    }
    
    const isLeftSwipe = diff > minDistance;
    const isRightSwipe = diff < -minDistance;
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    
    if (isLeftSwipe && currentIndex < sortedPending.length - 1) {
      nextCard(skipCount);
    } else if (isRightSwipe && currentIndex > 0) {
      prevCard(skipCount);
    } else {
      // Snap back to center with velocity-based duration
      if (cardRef.current) {
        const snapDuration = Math.min(0.6, Math.max(0.15, finalVelocity * 0.2));
        gsap.to(cardRef.current, {
          x: 0,
          duration: snapDuration,
          ease: "power2.out"
        });
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
    setLastTouchTime(null);
    setLastTouchX(null);
    setVelocity(0);
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    const now = Date.now();
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setTouchStartTime(now);
    setLastTouchTime(now);
    setLastTouchX(e.clientX);
    setVelocity(0);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStart || isAnimating) return;
    const now = Date.now();
    const diff = e.clientX - touchStart;
    
    // Calculate velocity based on recent movement
    if (lastTouchTime && lastTouchX !== null) {
      const timeDiff = now - lastTouchTime;
      const distanceDiff = Math.abs(e.clientX - lastTouchX);
      if (timeDiff > 0) {
        const currentVelocity = distanceDiff / timeDiff;
        setVelocity(currentVelocity);
      }
    }
    
    setDragOffset(diff);
    setTouchEnd(e.clientX);
    setLastTouchTime(now);
    setLastTouchX(e.clientX);
    
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: diff * 0.4 });
    }
  };

  const handleMouseUp = () => {
    if (!touchStart || isAnimating || !touchStartTime) return;
    
    const now = Date.now();
    const totalTime = now - touchStartTime;
    const diff = touchStart - (touchEnd || touchStart);
    
    // Calculate final velocity
    const finalVelocity = Math.abs(diff) / totalTime;
    
    // Calculate how many cards to skip based on velocity and distance
    let skipCount = 1;
    const absDiff = Math.abs(diff);
    
    if (finalVelocity > 1.5) {
      // Very fast swipe - skip multiple cards
      skipCount = Math.min(Math.floor(absDiff / 80) + 1, 5); // Max 5 cards
    } else if (finalVelocity > 1.0) {
      // Fast swipe - skip 2-3 cards
      skipCount = Math.min(Math.floor(absDiff / 100) + 1, 3);
    } else if (finalVelocity > 0.5) {
      // Medium-fast swipe - skip 1-2 cards
      skipCount = Math.min(Math.floor(absDiff / 120) + 1, 2);
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal single card
      skipCount = 1;
    } else {
      // Slow swipe - normal single card
      skipCount = 1;
    }
    
    // Dynamic thresholds based on velocity and distance
    let minDistance = 30; // Base minimum distance
    
    if (finalVelocity > 1.0) {
      // Very fast swipe - very low threshold
      minDistance = 15;
    } else if (finalVelocity > 0.5) {
      // Fast swipe - low threshold
      minDistance = 25;
    } else if (finalVelocity > 0.2) {
      // Medium swipe - normal threshold
      minDistance = 40;
    } else {
      // Slow swipe - higher threshold
      minDistance = 60;
    }
    
    const isLeftSwipe = diff > minDistance;
    const isRightSwipe = diff < -minDistance;
    
    setIsDragging(false);
    setDragOffset(0);
    
    if (isLeftSwipe && currentIndex < sortedPending.length - 1) {
      nextCard(skipCount);
    } else if (isRightSwipe && currentIndex > 0) {
      prevCard(skipCount);
    } else {
      // Snap back to center with velocity-based duration
      if (cardRef.current) {
        const snapDuration = Math.min(0.6, Math.max(0.15, finalVelocity * 0.2));
        gsap.to(cardRef.current, {
          x: 0,
          duration: snapDuration,
          ease: "power2.out"
        });
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
    setLastTouchTime(null);
    setLastTouchX(null);
    setVelocity(0);
  };

  // reset card position
  useLayoutEffect(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: 0, opacity: 1 });
    }
  }, []);

  return (
    <div>
      {/* Header with request count and navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">คำขออนุมัติ</h3>
          <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full border">
            {sortedPending.length}
          </span>
        </div>
        {sortedPending.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              onClick={() => prevCard()}
              disabled={currentIndex === 0 || isAnimating}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border hover:bg-accent"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[2.5rem] text-center font-medium">
              {currentIndex + 1}/{sortedPending.length}
            </span>
            <Button
              onClick={() => nextCard()}
              disabled={currentIndex === sortedPending.length - 1 || isAnimating}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border hover:bg-accent"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Card Container with GSAP Animation */}
      <div className="min-h-[350px] relative overflow-hidden">
        {/* Swipe indicators */}
        {/* Simple swipe hint */}
          {sortedPending.length > 1 && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/10 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-muted-foreground opacity-50">
              ปัดแรงๆ เพื่อข้ามหลายการ์ด
            </div>
          )}
        
        {sortedPending.length > 0 ? (
          <div ref={cardRef}>
            <Card className="shadow-sm border-border bg-background/50">
              <CardContent className="p-3">
                {/* Swipeable area - only the top part with info */}
                <div 
                  className="touch-none select-none"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <div className={`transition-all duration-200 ${
                    isDragging ? 'scale-102' : 'scale-100'
                  }`}>
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <Car className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base text-foreground truncate">
                          {sortedPending[currentIndex].plateNumber}
                        </div>
                        <div className="text-muted-foreground text-sm truncate">
                          {sortedPending[currentIndex].visitorName} • {sortedPending[currentIndex].destination}
                        </div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{sortedPending[currentIndex].time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                        {sortedPending[currentIndex].carImage ? (
                          <Image
                            src={`/${sortedPending[currentIndex].carImage}`}
                            alt={`Car ${sortedPending[currentIndex].plateNumber}`}
                            className="object-cover w-full h-full"
                            width={400}
                            height={192}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <Car className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons - not swipeable, always clickable */}
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => onDeny(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    variant="destructive"
                    className="px-4 py-6 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-red-600"
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    onClick={() => onApprove(sortedPending[currentIndex].id)}
                    disabled={isAnimating}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-6 text-sm rounded-lg flex-1 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400"
                  >
                    อนุมัติ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">ไม่มีคำขออนุมัติ</p>
          </div>
        )}
      </div>
    </div>
  );
};
