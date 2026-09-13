
// ==================================================
// ARTICLES UI
// ==================================================

let articles = [];

const container =
    document.getElementById("articles");

const filters =
    document.querySelectorAll(".filter");


function setCurrentDate() {

    const element =
        document.getElementById("current-date");

    if (!element) {
        return;
    }

    element.textContent =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone: "Asia/Kolkata",

                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(new Date());
}

function showAlert(success, message) {

    const alert =
        document.createElement("div");

    alert.textContent = message;

    alert.className =
        success
            ? "alert success"
            : "alert error";

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 2500);
}


// ==================================================
// LOAD ARTICLES
// ==================================================

async function loadArticles() {

    try {

        const response =
            await fetch("/api/articles");

        if (!response.ok) {
            throw new Error(
                "Failed to load articles"
            );
        }

        articles =
            await response.json();

        render("10");

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty">
                Failed to load articles.
            </div>
        `;
    }
}


// ==================================================
// RENDER
// ==================================================

function render(limit) {

    let visibleArticles;


    if (limit === "5") {

        visibleArticles =
            articles.slice(0, 5);

    } else if (limit === "10") {

        visibleArticles =
            articles.slice(0, 10);

    } else if (limit === "editorial") {

        visibleArticles = articles.filter(article =>
            article.url.includes("/opinion/") ||
            article.url.includes("/editorial/")
        );

    } else if (limit === "explained") {

       
        visibleArticles = articles.filter(article =>
            article.url.includes("/explained/")
        );

    }
    
    else {

        visibleArticles =
            articles;
    }


    if (!visibleArticles.length) {

        container.innerHTML = `
            <div class="empty">
                No articles found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        visibleArticles
            .map((article, index) => {
                const starred =  isArticleStarred(Number(article.id));
                return `
                    <article class="card">

                        <div class="rank">
                            ${index + 1}
                        </div>


                        <div class="content">

                            <a
                                class="title"
                                href="${escapeHTML(article.url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ${escapeHTML(article.title)}
                            </a>


                            <div class="meta">

                                <span class="meta-item votes">
                                    ★ ${formatVotes(article.votes)}
                                </span>

                                <span class="meta-divider"></span>

                                <span class="meta-item">
                                    ${formatPublishedTime(
                                        article.published_time
                                    )}
                                </span>

                            </div>

                        </div>


                        <div class="vote-area">

                            <button
                                class="star ${starred ? "active" : ""}"
                                data-id="${article.id}"
                                aria-label="Vote for article"
                                title="${starred ? "Already voted" : "Vote"}"
                                ${starred ? "disabled" : ""}
                            >
                                ${starred ? "★" : "☆"}
                            </button>

                            <span class="vote-label">
                                Vote
                            </span>

                        </div>

                    </article>
                `;
            })
            .join("");

    
            if(limit === "10")
            {
               container.insertAdjacentHTML("beforeend", `
                <div class="more" style="text-align:center; margin-top: 8px;">
                    <button class="filter" onclick="document.querySelector('.filter[data-limit=\\'all\\']').click()">
                        See more
                    </button>
                </div>
            `);
            }

    attachStarHandlers();
}


// ==================================================
// FORMAT VOTES
// ==================================================

function formatVotes(value) {

    const votes =
        Number(value) || 0;

    return votes.toLocaleString("en-IN");
}


// ==================================================
// FORMAT PUBLISHED TIME
// ==================================================

function formatPublishedTime(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return "";
    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",

            day: "2-digit",
            month: "short",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit",

            hour12: true
        }
    ).format(date);
}


// ==================================================
// STAR HANDLERS
// ==================================================

function attachStarHandlers() {

    document
        .querySelectorAll(".star")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    vote(
                        button.dataset.id,
                        button
                    );

                }
            );

        });
}


// ==================================================
// VOTE
// ==================================================

async function vote(articleId, button) {

    button.disabled = true;
    button.classList.add("processing");

    try {

        const response =
            await fetch("/api/vote", {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    article_id:
                        Number(articleId),
                    visitor_id: getVisitorId()
                })
            });


        const data = await response.json();
        
        button.classList.remove("processing");

        if (!response.ok || !data.success) {

            showAlert(
                false,
                data.message || "Vote failed"
            );
            button.disabled = false;
            return;
        }

        addStarredArticle(Number(articleId));
        button.outerHTML = `
            <button
                class="star active"
                data-id="${articleId}"
                aria-label="Vote for article"
                title="Already voted"
            disabled
            >
            ★
            </button>
        `;
    


        // Update local vote count.

        const article =
            articles.find(
                item =>
                    Number(item.id) ===
                    Number(articleId)
            );


        if (article) {

            article.votes =
                (Number(article.votes) || 0) + 1;

        }


        // Re-render so the vote count
        // updates immediately.

        render(
            getActiveFilter()
        );


    } catch (error) {

        showAlert(
                false,
                "Vote failed"
            );

        button.disabled = false;
    }
}


// ==================================================
// GET ACTIVE FILTER
// ==================================================

function getActiveFilter() {

    const active =
        document.querySelector(
            ".filter.active"
        );

    return active
        ? active.dataset.limit
        : "all";
}


// ==================================================
// FILTERS
// ==================================================

filters.forEach(filter => {

    filter.addEventListener(
        "click",
        () => {

            filters.forEach(button =>
                button.classList.remove(
                    "active"
                )
            );


            filter.classList.add(
                "active"
            );


            render(
                filter.dataset.limit
            );

        }
    );

});


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value ?? "";

    return element.innerHTML;
}


// ==================================================
// Gets a unique visitor ID for the current user
// ==================================================

function getVisitorId() {

    let visitorId =
        localStorage.getItem("visitor_id");

    if (!visitorId) {

        visitorId =
            crypto.randomUUID();

        localStorage.setItem(
            "visitor_id",
            visitorId
        );
    }

    return visitorId;
}

// ==================================================
// STARRED ARTICLES - Stored in Local Storage
// ==================================================

function getTodayKey() {

    const today =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Asia/Kolkata"
            }
        ).format(new Date());

    return `starred_${today}`;
}


function clearOldStarred() {

    const todayKey =
        getTodayKey();

    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);

        if (
            key &&
            key.startsWith("starred_") &&
            key !== todayKey
        ) {
            localStorage.removeItem(key);
        }
    }
}


function getStarredArticles() {

    const key =
        getTodayKey();

    try {

        return JSON.parse(
            localStorage.getItem(key) || "[]"
        );

    } catch {

        return [];
    }
}


function addStarredArticle(articleId) {

    const key =
        getTodayKey();

    const starred =
        getStarredArticles();

    if (!starred.includes(articleId)) {

        starred.push(articleId);

        localStorage.setItem(
            key,
            JSON.stringify(starred)
        );
    }
}


function isArticleStarred(articleId) {

    return getStarredArticles()
        .includes(articleId);
}

// ==================================================
// START
// ==================================================

setCurrentDate();
clearOldStarred();
loadArticles();

