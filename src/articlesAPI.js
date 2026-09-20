export async function getArticles(env) {
    const { results } = await env.DB.prepare(`
        SELECT
            id,
            title,
            url,
            published_time,
            metadata,
            votes
        FROM articles
        WHERE date = (
            SELECT MAX(date)
            FROM articles
        )
        ORDER BY votes DESC, published_time DESC
    `).all();


    const articles = results.map(article => ({
        ...article,
        metadata: article.metadata
            ? JSON.parse(article.metadata)
            : null
    }));


    return Response.json(articles);
}