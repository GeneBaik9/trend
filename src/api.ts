export interface Article {
    type_of: string;
    id: number;
    title: string;
    description: string;
    readable_publish_date: string;
    slug: string;
    path: string;
    url: string;
    comments_count: number;
    public_reactions_count: number;
    collection_id: number | null;
    published_timestamp: string;
    positive_reactions_count: number;
    cover_image: string | null;
    social_image: string;
    canonical_url: string;
    created_at: string;
    edited_at: string | null;
    crossposted_at: string | null;
    published_at: string;
    last_comment_at: string;
    reading_time_minutes: number;
    tag_list: string[];
    tags: string;
    user: {
        name: string;
        username: string;
        twitter_username: string | null;
        github_username: string | null;
        user_id: number;
        website_url: string | null;
        profile_image: string;
        profile_image_90: string;
    };
    trend_score?: number; // Our calculated metric
    readAt?: number; // Timestamp when marked as read
}

// DevTo API has an articles endpoint. We'll fetch tagged articles and calculate a "trend score"
export const fetchTrendingArticles = async (page: number = 1): Promise<Article[]> => {
    try {
        // Fetch multiple tags to get a broad base of coding & AI. We fetch 30 to sort and pick the best for the user.
        const res = await fetch(`https://dev.to/api/articles?tag=ai&state=fresh&per_page=30&page=${page}`);
        if (!res.ok) {
            throw new Error('Failed to fetch articles');
        }
        const data: Article[] = await res.json();

        // Calculate a dynamic trend score based on recentness, reactions, and comments
        const scoredData = data.map(article => {
            const hoursSincePublish = (Date.now() - new Date(article.published_timestamp).getTime()) / (1000 * 60 * 60);

            // Weight reactions highly, comments very highly, and discount by age to favor *recent* trends
            const reactionsWeight = article.public_reactions_count * 2;
            const commentsWeight = article.comments_count * 5;
            const agePenalty = Math.max(1, hoursSincePublish * 0.5);

            const score = (reactionsWeight + commentsWeight) / agePenalty;

            return {
                ...article,
                trend_score: score
            };
        });

        // Sort by our custom trend score descending
        scoredData.sort((a, b) => (b.trend_score || 0) - (a.trend_score || 0));

        // Return the top 10
        return scoredData.slice(0, 10);
    } catch (err) {
        console.error("Error fetching articles:", err);
        return [];
    }
};
