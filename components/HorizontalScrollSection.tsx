'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from '@/components/motion';
import { useTheme } from './ThemeProvider';

const scrollItems = [
  {
    title: 'Discovery',
    description: 'We dive deep into your business goals, target audience, and technical requirements to create a solid foundation.',
    icon: 'ri-search-line',
    stat: '01',
  },
  {
    title: 'Strategy',
    description: 'Crafting a comprehensive roadmap with clear milestones, tech stack decisions, and timeline estimates.',
    icon: 'ri-lightbulb-line',
    stat: '02',
  },
  {
    title: 'Design',
    description: 'Creating intuitive user experiences and stunning interfaces that align with your brand identity.',
    icon: 'ri-palette-line',
    stat: '03',
  },
  {
    title: 'Development',
    description: 'Building robust, scalable solutions using cutting-edge technologies and best practices.',
    icon: 'ri-code-s-slash-line',
    stat: '04',
  },
  {
    title: 'Testing',
    description: 'Rigorous quality assurance ensuring flawless performance across all devices and scenarios.',
    icon: 'ri-bug-line',
    stat: '05',
  },
  {
    title: 'Launch',
    description: 'Seamless deployment with monitoring, optimization, and ongoing support for your success.',
    icon: 'ri-rocket-line',
    stat: '06',
  },
];

export default function HorizontalScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const scrollToCard = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (card && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const cardRect = card.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollLeft = scrollContainer.scrollLeft + cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
      
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
      
      setFocusedIndex(index);
      setActiveCardIndex(index);
      card.focus();
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isInView) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = Math.min(focusedIndex + 1, scrollItems.length - 1);
        scrollToCard(nextIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = Math.max(focusedIndex - 1, 0);
        scrollToCard(prevIndex);
        break;
      case 'Home':
        e.preventDefault();
        scrollToCard(0);
        break;
      case 'End':
        e.preventDefault();
        scrollToCard(scrollItems.length - 1);
        break;
    }
  }, [isInView, focusedIndex, scrollToCard]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) return;
    
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;
    const verticalDistance = Math.abs(touchStartY.current - (touchEndX.current || touchStartY.current));
    
    if (Math.abs(swipeDistance) > swipeThreshold && Math.abs(swipeDistance) > verticalDistance) {
      if (swipeDistance > 0) {
        const nextIndex = Math.min(activeCardIndex + 1, scrollItems.length - 1);
        scrollToCard(nextIndex);
      } else {
        const prevIndex = Math.max(activeCardIndex - 1, 0);
        scrollToCard(prevIndex);
      }
    }
    
    isSwiping.current = false;
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [activeCardIndex, scrollToCard]);

  const updateActiveCard = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollContainer = scrollRef.current;
    const containerRect = scrollContainer.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    cardRefs.current.forEach((card, index) => {
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    setActiveCardIndex(closestIndex);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const scrollContent = scrollRef.current;
    if (!container || !scrollContent) return;

    const handleWheel = (e: WheelEvent) => {
      const rect = container.getBoundingClientRect();
      const isFullyVisible = rect.top <= 0 && rect.bottom >= window.innerHeight;
      
      if (!isFullyVisible) return;

      const maxScroll = scrollContent.scrollWidth - scrollContent.clientWidth;
      const currentScroll = scrollContent.scrollLeft;
      
      if (e.deltaY > 0 && currentScroll < maxScroll) {
        e.preventDefault();
        scrollContent.scrollLeft += e.deltaY;
      } else if (e.deltaY < 0 && currentScroll > 0) {
        e.preventDefault();
        scrollContent.scrollLeft += e.deltaY;
      }
      
      setScrollProgress(scrollContent.scrollLeft / maxScroll);
      updateActiveCard();
    };

    const handleScroll = () => {
      if (!scrollContent) return;
      const maxScroll = scrollContent.scrollWidth - scrollContent.clientWidth;
      setScrollProgress(scrollContent.scrollLeft / maxScroll);
      updateActiveCard();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    window.addEventListener('wheel', handleWheel, { passive: false });
    scrollContent.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('wheel', handleWheel);
      scrollContent.removeEventListener('scroll', handleScroll);
    };
  }, [updateActiveCard]);

  const getCardAnimationProps = (index: number) => {
    const isActive = index === activeCardIndex;
    const distance = Math.abs(index - activeCardIndex);
    
    return {
      scale: isActive ? 1 : Math.max(0.9, 1 - distance * 0.05),
      opacity: isActive ? 1 : Math.max(0.6, 1 - distance * 0.2),
      y: isActive ? 0 : distance * 8,
      rotateY: index < activeCardIndex ? 5 : index > activeCardIndex ? -5 : 0,
    };
  };

  return (
    <section
      ref={containerRef}
      className={`relative min-h-screen py-20 ${
        isDark
          ? 'bg-gradient-to-b from-[#0a0a0a] to-[#121212]'
          : 'bg-gradient-to-b from-white to-[#FAFAFA]'
      }`}
      aria-labelledby="process-heading"
    >
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2
            id="process-heading"
            className={`text-4xl md:text-6xl font-bold mb-6 font-mono ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Our <span className={isDark ? 'text-[#FF8C00]' : 'text-[#E07000]'}>Process</span>
          </h2>
          <p className={`text-xl max-w-3xl mx-auto mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            A proven methodology that transforms ideas into exceptional digital products.
          </p>
          <div className={`flex items-center justify-center gap-2 text-sm font-mono ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <i className="ri-mouse-line w-5 h-5 flex items-center justify-center md:block hidden" aria-hidden="true"></i>
            <span className="hidden md:inline">Scroll or use arrow keys to explore</span>
            <i className="ri-hand-coin-line w-5 h-5 flex items-center justify-center md:hidden" aria-hidden="true"></i>
            <span className="md:hidden">Swipe to explore</span>
            <i className="ri-arrow-right-line w-5 h-5 flex items-center justify-center" aria-hidden="true"></i>
          </div>
        </motion.div>
      </div>

      <div className="relative" style={{ perspective: '1000px' }}>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide gap-6 px-6 md:px-12 pb-8 snap-x snap-mandatory touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          role="region"
          aria-label="Process steps carousel"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {scrollItems.map((item, index) => (
            <motion.div
              key={item.title}
              ref={(el: HTMLDivElement | null) => { cardRefs.current[index] = el; }}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              animate={getCardAnimationProps(index)}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: { duration: 0.3 },
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
                rotateY: { duration: 0.4 }
              }}
              whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              tabIndex={0}
              role="article"
              aria-label={`Step ${item.stat}: ${item.title}`}
              onFocus={() => {
                setFocusedIndex(index);
                setActiveCardIndex(index);
              }}
              onClick={() => scrollToCard(index)}
              className={`flex-shrink-0 w-[85vw] md:w-[400px] lg:w-[450px] snap-center rounded-2xl p-8 transition-all duration-300 outline-none cursor-pointer relative overflow-hidden ${
                isDark
                  ? `bg-gradient-to-br from-[#1a1a1a] to-[#121212] border ${index === activeCardIndex ? 'border-[#FF8C00] shadow-[0_0_30px_rgba(255,140,0,0.3)]' : 'border-white/10 hover:border-[#FF8C00]/50'} focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/50`
                  : `bg-white border ${index === activeCardIndex ? 'border-[#E07000] shadow-[0_10px_40px_rgba(224,112,0,0.2)]' : 'border-gray-200 hover:border-[#E07000]/50'} shadow-sm hover:shadow-lg focus:border-[#E07000] focus:ring-2 focus:ring-[#E07000]/50`
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                index === activeCardIndex ? 'opacity-100' : ''
              } ${
                isDark 
                  ? 'bg-[radial-gradient(circle_at_70%_30%,rgba(255,140,0,0.15),transparent_70%)]' 
                  : 'bg-[radial-gradient(circle_at_70%_30%,rgba(224,112,0,0.08),transparent_70%)]'
              }`}></div>
              
              <motion.div 
                className="flex items-start justify-between mb-6 relative z-10"
                animate={{ 
                  x: index === activeCardIndex ? 0 : (index < activeCardIndex ? -5 : 5)
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isDark
                      ? index === activeCardIndex ? 'bg-[#FF8C00]/30' : 'bg-[#FF8C00]/20'
                      : index === activeCardIndex ? 'bg-[#E07000]/20' : 'bg-[#E07000]/10'
                  }`}
                  animate={{
                    scale: index === activeCardIndex ? 1.1 : 1,
                    rotate: index === activeCardIndex ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ 
                    scale: { duration: 0.3 },
                    rotate: { duration: 0.5, ease: 'easeInOut' }
                  }}
                >
                  <i
                    className={`${item.icon} text-2xl ${
                      isDark ? 'text-[#FF8C00]' : 'text-[#E07000]'
                    }`}
                  ></i>
                </motion.div>
                <motion.span
                  className={`text-5xl font-bold font-mono ${
                    isDark 
                      ? index === activeCardIndex ? 'text-[#FF8C00]/20' : 'text-white/10'
                      : index === activeCardIndex ? 'text-[#E07000]/20' : 'text-gray-100'
                  }`}
                  animate={{
                    opacity: index === activeCardIndex ? 0.3 : 0.15,
                    scale: index === activeCardIndex ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {item.stat}
                </motion.span>
              </motion.div>
              <motion.h3
                className={`text-2xl font-bold mb-4 font-mono relative z-10 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                animate={{
                  x: index === activeCardIndex ? 0 : 0,
                  color: index === activeCardIndex 
                    ? (isDark ? '#ffffff' : '#111827')
                    : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(17,24,39,0.7)')
                }}
                transition={{ duration: 0.3 }}
              >
                {item.title}
              </motion.h3>
              <motion.p
                className={`text-base leading-relaxed relative z-10 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
                animate={{
                  opacity: index === activeCardIndex ? 1 : 0.7
                }}
                transition={{ duration: 0.3 }}
              >
                {item.description}
              </motion.p>
              <motion.div 
                className={`mt-6 pt-6 border-t border-dashed relative z-10 ${
                  isDark 
                    ? index === activeCardIndex ? 'border-[#FF8C00]/30' : 'border-white/10'
                    : index === activeCardIndex ? 'border-[#E07000]/30' : 'border-gray-200'
                }`}
                animate={{
                  opacity: index === activeCardIndex ? 1 : 0.5
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`flex items-center gap-2 text-sm font-mono cursor-pointer transition-colors ${
                    isDark
                      ? 'text-[#FF8C00] hover:text-[#FF8C00]/80'
                      : 'text-[#E07000] hover:text-[#E07000]/80'
                  }`}
                  animate={{
                    x: index === activeCardIndex ? 5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <span>Learn more</span>
                  <motion.i 
                    className="ri-arrow-right-line w-4 h-4 flex items-center justify-center"
                    animate={{
                      x: index === activeCardIndex ? [0, 5, 0] : 0
                    }}
                    transition={{ 
                      duration: 1,
                      repeat: index === activeCardIndex ? Infinity : 0,
                      repeatDelay: 1
                    }}
                  ></motion.i>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-8 px-6" role="progressbar" aria-valuenow={Math.round(scrollProgress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Scroll progress">
          <div
            className={`w-full max-w-md h-1 rounded-full overflow-hidden ${
              isDark ? 'bg-white/10' : 'bg-gray-200'
            }`}
          >
            <motion.div
              className={`h-full rounded-full ${
                isDark
                  ? 'bg-gradient-to-r from-[#FF8C00] to-[#FF6A00]'
                  : 'bg-gradient-to-r from-[#E07000] to-[#D45500]'
              }`}
              animate={{ width: `${Math.max(scrollProgress * 100, 5)}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          {scrollItems.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                isDark
                  ? index === activeCardIndex ? 'bg-[#FF8C00]' : 'bg-white/20 hover:bg-white/40'
                  : index === activeCardIndex ? 'bg-[#E07000]' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              animate={{
                scale: index === activeCardIndex ? 1.5 : 1,
                width: index === activeCardIndex ? 24 : 8
              }}
              transition={{ duration: 0.3 }}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <motion.button
            onClick={() => scrollToCard(Math.max(activeCardIndex - 1, 0))}
            disabled={activeCardIndex <= 0}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer ${
              isDark
                ? 'bg-white/10 text-white hover:bg-[#FF8C00]/20 focus:ring-[#FF8C00] disabled:opacity-30 disabled:cursor-not-allowed'
                : 'bg-gray-100 text-gray-900 hover:bg-[#E07000]/10 focus:ring-[#E07000] disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
            aria-label="Previous step"
          >
            <i className="ri-arrow-left-s-line text-xl" aria-hidden="true"></i>
          </motion.button>
          <motion.button
            onClick={() => scrollToCard(Math.min(activeCardIndex + 1, scrollItems.length - 1))}
            disabled={activeCardIndex >= scrollItems.length - 1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer ${
              isDark
                ? 'bg-white/10 text-white hover:bg-[#FF8C00]/20 focus:ring-[#FF8C00] disabled:opacity-30 disabled:cursor-not-allowed'
                : 'bg-gray-100 text-gray-900 hover:bg-[#E07000]/10 focus:ring-[#E07000] disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
            aria-label="Next step"
          >
            <i className="ri-arrow-right-s-line text-xl" aria-hidden="true"></i>
          </motion.button>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
