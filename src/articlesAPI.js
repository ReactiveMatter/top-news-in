export async function getArticles(env) {
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    const { results } = await env.DB.prepare(`
        SELECT
            id,
            title,
            url,
            published_time,
            votes
        FROM articles
        WHERE date = ?
        ORDER BY votes DESC, published_time DESC
    `)
        .bind(today)
        .all();

    return Response.json(results);
}