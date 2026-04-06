import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RefreshCw, 
  Globe, 
  Search, 
  Filter, 
  AlertCircle,
  Clock,
  TrendingUp,
  LayoutGrid,
  List
} from "lucide-react";
import { Article, NewsResponse } from "./types";
import { NewsCard } from "./components/NewsCard";
import { cn } from "./lib/utils";

export default function App() {
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const endpoint = isRefresh ? "/api/refresh" : "/api/news";
      const method = isRefresh ? "POST" : "GET";
      
      const response = await fetch(endpoint, { method });
      if (!response.ok) throw new Error("Failed to fetch news");
      
      // If refresh, we need to fetch again to get the data
      if (isRefresh) {
        const dataResponse = await fetch("/api/news");
        const data = await dataResponse.json();
        setNews(data);
      } else {
        const data = await response.json();
        setNews(data);
      }
    } catch (err) {
      setError("Could not load the latest news. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const sources = useMemo(() => {
    if (!news) return ["All"];
    const uniqueSources = Array.from(new Set(news.articles.map(a => a.source)));
    return ["All", ...uniqueSources];
  }, [news]);

  const filteredArticles = useMemo(() => {
    if (!news) return [];
    return news.articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.source.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = selectedSource === "All" || article.source === selectedSource;
      return matchesSearch && matchesSource;
    });
  }, [news, searchQuery, selectedSource]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Global<span className="text-blue-600">Pulse</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Real-time News Scraper
              </p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search headlines or sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats & Filters */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-600">
                {filteredArticles.length} Headlines Found
              </span>
            </div>
            {news && (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Last updated: {new Date(news.fetched_at).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "grid" ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "list" ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
              >
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button 
              onClick={() => fetchNews()}
              className="ml-auto text-sm font-bold underline underline-offset-4"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredArticles.length > 0 ? (
              <motion.div 
                layout
                className={cn(
                  "grid gap-6",
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1"
                )}
              >
                {filteredArticles.map((article, index) => {
                  return (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      index={index} 
                    />
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="mb-4 rounded-full bg-slate-100 p-6">
                  <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No articles found</h3>
                <p className="text-slate-500">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-black tracking-tight">GlobalPulse</span>
          </div>
          <p className="text-sm text-slate-500">
            Aggregating headlines from the world's most trusted news sources.
          </p>
          <div className="mt-6 flex justify-center flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>BBC</span>
            <span>AP News</span>
            <span>Al Jazeera</span>
            <span>The Hindu</span>
            <span>DW News</span>
            <span>SCMP</span>
            <span>The Guardian</span>
            <span>NPR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
