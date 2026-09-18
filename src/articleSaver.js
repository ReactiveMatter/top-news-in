// ==================================================
// ARTICLE SAVER
// ==================================================

export async function saveArticles(articles, db) {

    const statements =
        articles.map(article =>
            db.prepare(`
                INSERT OR IGNORE INTO articles
                    (
                        title,
                        url,
                        date,
                        published_time,
                        metadata,
                        votes
                    )
                VALUES (?, ?, ?, ?, ?,?)
            `).bind(
                article.title,
                article.url,
                article.date,
                article.published_time,
                JSON.stringify(article.metadata),
                article.initial_votes
            )
        );

    if (statements.length) {
        await db.batch(statements);
    }
}