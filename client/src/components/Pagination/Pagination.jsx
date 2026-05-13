import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-border-light flex items-center justify-between bg-background-muted/10">
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="p-2 rounded-lg border border-border-light text-text-secondary hover:bg-background-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center space-x-1">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                  currentPage === pageNum 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-text-muted hover:bg-background-muted'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="p-2 rounded-lg border border-border-light text-text-secondary hover:bg-background-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
