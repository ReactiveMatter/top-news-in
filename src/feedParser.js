// ==================================================
// FEED PARSER
// ==================================================

import {
    clean,
    cleanHTML,
    normalizeURL,
    getAllowedISTDates,
    getISTDateKey,
} from "./utils.js";


const feedURLs = [
    "https://indianexpress.com/feed/",
    "https://indianexpress.com/section/india/feed/",
];


// ==================================================
// PROCESS FEEDS
// ==================================================

export async function processFeeds(env) {

    const now = new Date();

    // Date on which this feed processing run happened
    const date = getISTDateKey(now);

    const allowedDates =
        getAllowedISTDates(now);

    const allArticles = [];


    for (const feedURL of feedURLs) {

        try {

            const articles = await parseFeed(
                feedURL,
                date,
                allowedDates
            );

            allArticles.push(...articles);

        } catch (error) {

            console.error(
                `Failed to process ${feedURL}:`,
                error
            );
        }
    }


    if (!allArticles.length) {
        return;
    }


    // Send all articles from all feeds
    // as one Queue message
    await env.PARSED_ARTICLES_QUEUE.send(
        allArticles
    );
}


// ==================================================
// FETCH + PARSE ONE FEED
// ==================================================

async function parseFeed(
    feedURL,
    date,
    allowedDates
) {

    const response = await fetch(feedURL, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 FeedReader/1.0",

            "Accept":
                "application/rss+xml, application/xml, text/xml",
        },
    });


    if (!response.ok) {

        throw new Error(
            `Feed returned HTTP ${response.status}`
        );
    }


    const xml = await response.text();

    const items =
        xml.match(
            /<item[\s\S]*?<\/item>/gi
        ) || [];


    const seenURLs = new Set();

    const articles = [];


    for (const item of items) {

        const title = clean(
            getTag(item, "title")
        );

        const url = normalizeURL(
            clean(getTag(item, "link"))
        );

        const pubDate = clean(
            getTag(item, "pubDate")
        );

        
        const author = clean(
            getTag(item, "dc:creator")
        );

        const categories = getTags(
            item,
            "category"
        ).map(clean);


        if (!title || !url || !pubDate) {
            continue;
        }


        if (seenURLs.has(url)) {
            continue;
        }

        seenURLs.add(url);


        const publishedDate =
            new Date(pubDate);


        if (
            Number.isNaN(
                publishedDate.getTime()
            )
        ) {
            continue;
        }

        // Date the article was published in IST
        const publishedDateKey =
            getISTDateKey(publishedDate);


        // Only process today's or yesterday's articles
        if (!allowedDates.has(publishedDateKey)) {
            continue;
        }


        articles.push({

            title,

            url,

            // Date when this feed was processed
            date,

            // Actual article publication time
            published_time:
                publishedDate.toISOString(),

             metadata: {
                author: author || null,
                category: categories,
            },

        });
    }
    return articles;
}


// ==================================================
// XML HELPERS
// ==================================================

function getTag(xml, tag) {

    const regex = new RegExp(
        `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
        "i"
    );

    const match = xml.match(regex);

    return match ? match[1] : "";
}


function getTags(xml, tag) {

    const regex = new RegExp(
        `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
        "gi"
    );

    return [...xml.matchAll(regex)]
        .map(match => match[1]);
}