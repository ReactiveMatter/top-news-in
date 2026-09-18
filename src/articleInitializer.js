// ==================================================
// ARTICLE INITIALIZER
// ==================================================

import initializationRules from "./initializationRules.json";

// ==================================================
// INITIALIZE ARTICLES
// ==================================================

export function initializeArticles(articles) {

    return articles.map(article => ({

        ...article,

        initial_votes:
            calculateInitialVotes(article),

    }));
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// ==================================================
// INITIAL VOTE CALCULATION
// ==================================================

function calculateInitialVotes(article) {
    
    const text =
        `${article.title}`
            .toLowerCase();

    let score = 0;

    for (const rule of Object.values(initializationRules)) {
        let thisRuleScore = 0;
        for (const keyword of rule.keywords) {
            const pattern =
                `\\b${escapeRegex(keyword)}\\b`;

            if (new RegExp(pattern, "i").test(text)) {
                score += rule.score;
                thisRuleScore += rule.score;
                break;
            }
        }
    }

    return score;
}