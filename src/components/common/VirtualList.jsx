import { useRef, memo, forwardRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * VirtualList Component
 * 
 * Renders large lists efficiently by only mounting visible items.
 * Perfect for job listings, project listings, and other long lists.
 * 
 * @example
 * <VirtualList
 *   items={jobs}
 *   estimateSize={200}
 *   renderItem={({ item, index }) => <JobCard job={item} />}
 *   className="h-[600px]"
 * />
 */
export const VirtualList = memo(forwardRef(({
  items,
  renderItem,
  estimateSize = 100,
  overscan = 5,
  gap = 16,
  className = '',
  horizontal = false,
  paddingStart = 0,
  paddingEnd = 0,
  getItemKey,
  onScroll,
  LoadingPlaceholder,
  EmptyPlaceholder,
  isLoading = false,
}, ref) => {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    horizontal,
    paddingStart,
    paddingEnd,
    getItemKey: getItemKey ? (index) => getItemKey(items[index], index) : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Expose virtualizer methods via ref
  if (ref) {
    ref.current = {
      scrollToIndex: (index, options) => virtualizer.scrollToIndex(index, options),
      scrollToOffset: (offset, options) => virtualizer.scrollToOffset(offset, options),
      scrollBy: (delta) => virtualizer.scrollBy(delta),
      getTotalSize: () => virtualizer.getTotalSize(),
    };
  }

  // Show loading state
  if (isLoading && LoadingPlaceholder) {
    return <LoadingPlaceholder />;
  }

  // Show empty state
  if (!isLoading && items.length === 0 && EmptyPlaceholder) {
    return <EmptyPlaceholder />;
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      onScroll={onScroll}
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: horizontal ? '100%' : `${virtualizer.getTotalSize()}px`,
          width: horizontal ? `${virtualizer.getTotalSize()}px` : '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: horizontal ? 0 : 0,
                left: horizontal ? 0 : 0,
                width: horizontal ? undefined : '100%',
                height: horizontal ? '100%' : undefined,
                transform: horizontal 
                  ? `translateX(${virtualItem.start}px)`
                  : `translateY(${virtualItem.start}px)`,
                paddingBottom: !horizontal ? `${gap}px` : undefined,
                paddingRight: horizontal ? `${gap}px` : undefined,
              }}
            >
              {renderItem({ 
                item, 
                index: virtualItem.index,
                isFirst: virtualItem.index === 0,
                isLast: virtualItem.index === items.length - 1,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}));

VirtualList.displayName = 'VirtualList';

/**
 * VirtualGrid Component
 * 
 * Renders large grids efficiently by only mounting visible items.
 * Great for card layouts with multiple columns.
 */
export const VirtualGrid = memo(({
  items,
  renderItem,
  estimateSize = 300,
  columns = 3,
  gap = 16,
  className = '',
  overscan = 3,
  isLoading = false,
  LoadingPlaceholder,
  EmptyPlaceholder,
}) => {
  const parentRef = useRef(null);
  
  // Calculate rows from items
  const rowCount = Math.ceil(items.length / columns);
  
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Show loading state
  if (isLoading && LoadingPlaceholder) {
    return <LoadingPlaceholder />;
  }

  // Show empty state
  if (!isLoading && items.length === 0 && EmptyPlaceholder) {
    return <EmptyPlaceholder />;
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                paddingBottom: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const index = startIndex + colIndex;
                return (
                  <div key={index}>
                    {renderItem({ 
                      item, 
                      index,
                      row: virtualRow.index,
                      col: colIndex,
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualGrid.displayName = 'VirtualGrid';

/**
 * useInfiniteScroll Hook
 * 
 * Hook for implementing infinite scroll with virtual lists.
 */
export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  loadMore,
  threshold = 0.9, // Load more when 90% scrolled
}) => {
  const handleScroll = (event) => {
    if (isLoading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= threshold) {
      loadMore();
    }
  };
  
  return { onScroll: handleScroll };
};

export default VirtualList;
