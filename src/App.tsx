import React, { useState, useEffect } from 'react';
import { fetchTrendingArticles, Article } from './api';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, CheckCircle, Clock, TrendingUp, History, Sparkles, AlertCircle } from 'lucide-react';

const ArticleCard = ({
    article,
    onMarkRead,
    isHistory = false
}: {
    article: Article;
    onMarkRead?: (id: number) => void;
    isHistory?: boolean;
}) => {
    return (
        <div className={`glass-card animate-slide-up`} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', gap: '1rem' }}>
            {article.cover_image && (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <img
                        src={article.cover_image}
                        alt={article.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    />
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {article.tag_list.slice(0, 3).map(tag => (
                    <span key={tag} style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(88, 166, 255, 0.1)',
                        color: 'var(--accent-color)',
                        borderRadius: '12px',
                        fontWeight: 600
                    }}>
                        #{tag}
                    </span>
                ))}
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', flex: 1 }}>
                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {article.title}
                </a>
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {article.description}
            </p>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <TrendingUp size={14} /> {Math.round(article.trend_score || 0)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} /> {article.reading_time_minutes}m target
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Read Article">
                        <ExternalLink size={18} />
                    </a>

                    {!isHistory && onMarkRead && (
                        <button className="btn btn-primary" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => onMarkRead(article.id)} title="Mark as Read">
                            <CheckCircle size={18} />
                        </button>
                    )}

                    {isHistory && article.readAt && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            Read {formatDistanceToNow(article.readAt, { addSuffix: true })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

function App() {
    const [activeTab, setActiveTab] = useState<'main' | 'history'>('main');
    const [articles, setArticles] = useState<Article[]>([]);
    const [history, setHistory] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Load state from local storage on mount
    useEffect(() => {
        const savedArticles = localStorage.getItem('trend_articles');
        const savedHistory = localStorage.getItem('trend_history');
        if (savedArticles) setArticles(JSON.parse(savedArticles));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, []);

    // Save state whenever it changes
    useEffect(() => {
        localStorage.setItem('trend_articles', JSON.stringify(articles));
        localStorage.setItem('trend_history', JSON.stringify(history));
    }, [articles, history]);

    const handleFetchMore = async () => {
        setLoading(true);
        setError(null);
        try {
            const newArticles = await fetchTrendingArticles(page);

            // Filter out articles already in our arrays based on ID
            const existingIds = new Set([...articles.map(a => a.id), ...history.map(a => a.id)]);
            const uniqueNewArticles = newArticles.filter(a => !existingIds.has(a.id));

            setArticles(prev => [...uniqueNewArticles, ...prev]);
            setPage(p => p + 1);
        } catch (err) {
            setError('Failed to fetch articles. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (id: number) => {
        const articleToMove = articles.find(a => a.id === id);
        if (!articleToMove) return;

        const readArticle = { ...articleToMove, readAt: Date.now() };

        setArticles(prev => prev.filter(a => a.id !== id));
        setHistory(prev => [readArticle, ...prev]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Header */}
            <header className="glass-panel" style={{
                position: 'sticky',
                top: '1rem',
                zIndex: 100,
                margin: '1rem auto',
                width: 'calc(100% - 2rem)',
                maxWidth: '1200px',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--accent-color)', borderRadius: '12px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: '0 0 15px var(--accent-glow)' }}>
                        <Sparkles size={24} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>TrendPulse</h1>
                </div>

                <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '10px' }}>
                    <button
                        onClick={() => setActiveTab('main')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'main' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: activeTab === 'main' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <TrendingUp size={16} /> Trending
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <History size={16} /> History ({history.length})
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container" style={{ flex: 1, paddingBottom: '4rem' }}>

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {activeTab === 'main' ? 'Today\'s AI & Coding Trends' : 'Reading History'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {activeTab === 'main'
                                ? 'Curated from Dev.to based on community reactions and engagement.'
                                : 'Articles you have previously explored.'}
                        </p>
                    </div>

                    {activeTab === 'main' && (
                        <button className="btn btn-primary" onClick={handleFetchMore} disabled={loading}>
                            {loading ? (
                                <>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} /> Load 10 New Trends
                                </>
                            )}
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {activeTab === 'main' ? (
                        articles.length > 0 ? (
                            articles.map(article => (
                                <ArticleCard
                                    key={article.id}
                                    article={article}
                                    onMarkRead={markAsRead}
                                />
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                                <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h3>No trends loaded yet</h3>
                                <p>Click the button above to discover the latest AI and coding articles.</p>
                            </div>
                        )
                    ) : (
                        history.length > 0 ? (
                            history.map(article => (
                                <ArticleCard
                                    key={`history-${article.id}`}
                                    article={article}
                                    isHistory={true}
                                />
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                                <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h3>Your history is empty</h3>
                                <p>Articles you mark as read will appear here.</p>
                            </div>
                        )
                    )}
                </div>
            </main>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default App;
