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

    return Response.json(results);
}