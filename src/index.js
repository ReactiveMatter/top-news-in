import { processFeeds } from "./feedParser.js";
import { initializeArticles } from "./articleInitializer.js";
import { saveArticles } from "./articleSaver.js";
import { getArticles } from "./articlesAPI.js";
import { voteArticle } from "./vote.js";
import { fetchArticle } from "./fetchArticleContent.js";

export default {

    // ==================================================
    // CRON
    // ==================================================

    async scheduled(controller, env, ctx) {

        ctx.waitUntil(
            processFeeds(env)
        );
    },


    // ==================================================
    // HTTP
    // ==================================================

    async fetch(request, env, ctx) {

        const url =
            new URL(request.url);

		const ip = request.headers.get("CF-Connecting-IP") || "127.0.0.1";

        if (
            url.pathname === "/api/articles" &&
            request.method === "GET"
        ) {
            return getArticles(env);
        }

		if (
				url.pathname === "/api/vote" &&
				request.method === "POST"
			) {

				try {

					const body =
						await request.json();

					const articleId =
						Number(body.article_id);

					const visitorId =
						body.visitor_id;


					if (
						!Number.isInteger(articleId) ||
						!visitorId
					) {

						return Response.json(
							{
								success: false,
								message: "Invalid vote data."
							},
							{ status: 400 }
						);
					}


					const result =
						await voteArticle(
							articleId,
							visitorId,
							ip,
							env.DB
						);


					return Response.json(
						result,
						{
							status:
								result.success
									? 200
									: 400
						}
					);

				} catch (error) {

					console.error(
						"Vote API failed:",
						error
					);

					return Response.json(
						{
							success: false,
							message: "Invalid request."
						},
						{ status: 400 }
					);
				}
			}


        if (
            url.pathname === "/run-feeds" &&
            request.method === "GET"
        ) {
            const token =
				request.headers.get("Authorization");

			if (
				token !== `Bearer ${env.RUN_FEEDS_TOKEN}`
			) {
				return new Response(
					"Unauthorized",
					{ status: 401 }
				);
			}

			await processFeeds(env);
			return new Response(
					"Feeds processed",
					{ status: 200 }
				);
        }

       if (
                url.pathname === "/fetch" &&
                request.method === "GET"
            ) {
                const articleURL =
                    url.searchParams.get("url");

                if (!articleURL) {
                    return Response.json(
                        {
                            success: false,
                            message: "Article URL is required."
                        },
                        { status: 400 }
                    );
                }

                try {

                    const article =
                        await fetchArticle(articleURL);

                    return Response.json({
                        success: true,
                        data: article
                    });

                } catch (error) {

                    console.error(
                        "Article fetch failed:",
                        error
                    );

                    return Response.json(
                        {
                            success: false,
                            message: "Failed to fetch article."
                        },
                        { status: 500 }
                    );
                }
            }

        return env.ASSETS.fetch(request);
    },


    // ==================================================
    // QUEUES
    // ==================================================

    async queue(batch, env, ctx) {

        for (const message of batch.messages) {

            try {

                if (
                    batch.queue === "parsed-articles"
                ) {

                    const articles =
                        message.body;


                    const initializedArticles =
                        initializeArticles(
                            articles
                        );


                    await env
                        .INITIALIZED_ARTICLES_QUEUE
                        .send(
                            initializedArticles
                        );
                }


                else if (
                    batch.queue === "initialized-articles"
                ) {

                    const articles =
                        message.body;


                    await saveArticles(
                        articles,
                        env.DB
                    );
                }


                message.ack();

            } catch (error) {

                console.error(
                    `Queue processing failed (${batch.queue}):`,
                    error
                );

                message.retry();
            }
        }
    }
};