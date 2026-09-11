// ==================================================
// VOTE
// ==================================================


export async function voteArticle(
    articleId,
    visitorId,
    ip,
    db
) {

    // ----------------------------------------------
    // TODAY'S DATE
    // ----------------------------------------------

    const today =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Asia/Kolkata",

                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(new Date());


    // ----------------------------------------------
    // CHECK ARTICLE
    // ----------------------------------------------

    const article =
        await db.prepare(`
            SELECT id
            FROM articles
            WHERE id = ?
              AND date = ?
        `)
            .bind(
                articleId,
                today
            )
            .first();


    if (!article) {

        return {
            success: false,
            message: "Article is not available for voting."
        };
    }


    // ----------------------------------------------
    // CHECK IP VOTE LIMIT
    // ----------------------------------------------

    try {

        const ipLimit =
            await db.prepare(`
                INSERT INTO ip_vote_limits (
                    ip,
                    date,
                    count
                )
                VALUES (?, ?, 1)

                ON CONFLICT(ip, date)
                DO UPDATE SET
                    count = count + 1

                WHERE count < 100

                RETURNING count
            `)
                .bind(
                    ip,
                    today
                )
                .first();


        if (!ipLimit) {

            return {
                success: false,
                message:
                    "Daily voting limit reached for this IP."
            };
        }

    } catch (error) {

        console.error(
            "IP vote limit failed:",
            error
        );

        return {
            success: false,
            message:
                "Failed to check voting limit."
        };
    }


    // ----------------------------------------------
    // INSERT VOTE
    // ----------------------------------------------

    try {

        await db.prepare(`
            INSERT INTO votes (
                article_id,
                user_id
            )
            VALUES (?, ?)
        `)
            .bind(
                articleId,
                visitorId
            )
            .run();


    } catch (error) {

        // Duplicate vote

        if (
            error.message &&
            error.message.includes(
                "UNIQUE constraint failed"
            )
        ) {

            return {
                success: false,
                message:
                    "Already voted for this article."
            };
        }


        console.error(
            "Vote insert failed:",
            error
        );


        return {
            success: false,
            message:
                "Failed to record vote."
        };
    }


    // ----------------------------------------------
    // INCREMENT VOTE COUNT
    // ----------------------------------------------

    try {

        const result =
            await db.prepare(`
                UPDATE articles
                SET votes = votes + 1
                WHERE id = ?
                  AND date = ?
                RETURNING id, votes
            `)
                .bind(
                    articleId,
                    today
                )
                .first();


        return {
            success: true,
            message:
                "Vote recorded successfully."
        };

    } catch (error) {

        console.error(
            "Failed to update vote count:",
            error
        );


        return {
            success: false,
            message:
                "Vote was recorded but count update failed."
        };
    }
}

