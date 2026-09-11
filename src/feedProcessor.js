// ==================================================
// FEED PROCESSOR
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
// PROCESS ALL FEEDS
// ==================================================

export async function processFeeds(db) {
    const now = new Date();

    for (const feedURL of feedURLs) {
        try {
            await processFeed(feedURL, db, now);
        } catch (error) {
            console.error(
                `Failed to process ${feedURL}:`,
                error
            );
        }
    }
}


// ==================================================
// PROCESS FEED
// ==================================================

async function processFeed(feedURL, db, now) {
    const response = await fetch(feedURL, {
        headers: {
            "User-Agent": "Mozilla/5.0 FeedReader/1.0",
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

    // Parse RSS
    const articles = parseRSS(xml);

    // Only process today and yesterday (IST)
    const allowedDates = getAllowedISTDates(now);

    const createdAt = now.toISOString();

    const seenURLs = new Set();
    const rows = [];

    for (const article of articles) {
        const url = normalizeURL(article.link);

        if (!url || seenURLs.has(url)) {
            continue;
        }

        seenURLs.add(url);

        if (!article.pubDate) {
            continue;
        }

        const publishedDate = new Date(article.pubDate);

        if (Number.isNaN(publishedDate.getTime())) {
            continue;
        }

        const date = getISTDateKey(publishedDate);

        if (!allowedDates.has(date)) {
            continue;
        }

        rows.push({
            title: article.title,
            url,
            description: article.description || null,
            date,
            published_time: publishedDate.toISOString(),
            created_at: createdAt,
        });
    }

    if (!rows.length) {
        return;
    }

    // Save to D1
    const statements = rows.map(article =>
        db.prepare(`
            INSERT OR IGNORE INTO articles
                (
                    title,
                    url,
                    description,
                    date,
                    published_time,
                    created_at
                )
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            article.title,
            article.url,
            article.description,
            article.date,
            article.published_time,
            article.created_at
        )
    );

    await db.batch(statements);
}


// ==================================================
// RSS PARSER
// ==================================================

function parseRSS(xml) {
    const items =
        xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    return items
        .map(item => ({
            title: clean(
                getTag(item, "title")
            ),

            link: clean(
                getTag(item, "link")
            ),

            description: cleanHTML(
                getTag(item, "description")
            ),

            pubDate: clean(
                getTag(item, "pubDate")
            ),
        }))
        .filter(article =>
            article.title &&
            article.link
        );
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