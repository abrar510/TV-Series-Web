import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { TvShow } from '../types';
import { ShowCard } from './ShowCard';

interface ShowCarouselProps {
  title: string;
  subtitle?: string;
  shows: TvShow[];
  onSelectShow: (slug: string) => void;
  onViewAll?: () => void;
}

export const ShowCarousel: React.FC<ShowCarouselProps> = ({
  title,
  subtitle,
  shows,
  onSelectShow,
  onViewAll
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!shows || shows.length === 0) return null;

  return (
    <section className="relative py-4 group/carousel">
      {/* Header with Title and Desktop Arrows */}
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer mr-2"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Desktop Left/Right Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 pb-3"
      >
        {shows.map((show) => (
          <div
            key={show.id}
            className="w-36 sm:w-44 md:w-52 shrink-0"
          >
            <ShowCard show={show} onSelect={onSelectShow} />
          </div>
        ))}
      </div>
    </section>
  );
};
