import React from "react";
import { motion } from "motion/react";
import { ExternalLink, Globe } from "lucide-react";
import { Article } from "../types";
import { cn } from "../lib/utils";

export const NewsCard: React.FC<{ article: Article; index: number }> = ({ article, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100"
    >
      {/* Article Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${article.id}/800/450`;
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50">
            <Globe className="h-12 w-12 text-slate-200" />
          </div>
        )}
        <div 
          className="absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
          style={{ backgroundColor: article.color }}
        >
          {article.source}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>{article.country}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        
        <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-tight text-slate-900 group-hover:text-blue-600 transition-colors">
          {article.title}
        </h3>
        
        {article.description && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {article.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Read Article
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
