
import {navigate, resolve, route} from "./router.js"

// ==================================================
// ARTICLES UI
// ==================================================


let articles = [];
let articlesLoaded = false;

route('/', ({params, query})=>{

    setFilter('10');
    setView("article-list");
    loadArticles();

});

route('/all', ({params, query})=>{
    setFilter('all');
    setView("article-list");
    loadArticles('all');
});

route('/editorial', ({params, query})=>{
    setFilter('editorial');
    setView("article-list");
    loadArticles('editorial');
});

route('/explained', ({params, query})=>{
    setFilter('explained');
    setView("article-list");

    loadArticles('explained');
});

route('/article/:url', ({params, query})=>{
    setView("article-view");
    if(params.url)
    {
        displayArticle(params.url);
    }
    else 
    {
        document.querySelector("#article-root").innerHTML(`<div class="empty">URL is required.</div>`);
    }
    
});

function setView(mode="article-list")
{
    if (mode === "article-list")
    {
    document.querySelectorAll("#article-root").forEach((e)=>{ e.style.display = "none"});
    document.querySelectorAll(".articles").forEach((e)=>{ e.style.display = "flex"});
    document.querySelectorAll("header").forEach((e)=>{ e.style.display = "block"});
    document.querySelectorAll(".toolbar").forEach((e)=>{ e.style.display = "block"});
    }
    else if(mode === "article-view")
    {
    document.querySelectorAll("#article-root").forEach((e)=>{ e.style.display = "block"});
    document.querySelectorAll(".articles").forEach((e)=>{ e.style.display = "none"});
    document.querySelectorAll("header").forEach((e)=>{ e.style.display = "none"});
    document.querySelectorAll(".toolbar").forEach((e)=>{ e.style.display = "none"});
    }
}


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

async function loadArticles(filter) {

    if(!filter) 
    {
        filter = '10';
    }

   if(articlesLoaded)
   {
        render(filter);
        return;
   }
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

        articlesLoaded = true;
        render(filter);

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
            article.title.includes("Column |") ||
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

                            <span
                                class="title"
                                data-url="${escapeHTML(article.url)}"
                                data-id="${article.id}"
                
                            >
                                ${escapeHTML(article.title)}
                            </span>


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
        button.classList.remove("processing");
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

function setFilter(f)
{
    filters.forEach(filter => {
        if(filter.dataset.limit === f)
        {
            filter.classList.add('active');
        }
        else
        {
             filter.classList.remove('active');
        }
    });

}

filters.forEach(filter => {

    filter.addEventListener(
        "click",
        () => {


            if(filter.dataset.limit === '10')
            {
                 navigate('/');
            }
            else
            {
                 navigate('/'+filter.dataset.limit);
            }    

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
// Display article
// ==================================================
async function displayArticle(articleUrl) {

    if(!articlesLoaded)
    {
        await loadArticles();
        console.log(articles);
    }

   const articleRoot = document.getElementById("article-root");

   const article =
    articles.find(article => {
        if (article.url === articleUrl) {
            return true;
        }


        return false;
    });


    if (!article) {
        articleRoot.innerHTML =
            `<div class="empty">Article not found</div>`;
        return;
    }

    const title =
        article.title;

    const url =
        articleUrl;
    
    const starred =  isArticleStarred(Number(article.id));
    const starButton = `
     <button
    class="star ${starred ? "active" : ""}"
    data-id="${article.id}"
    aria-label="Vote for article"
    title="${starred ? "Already voted" : "Vote"}"
    ${starred ? "disabled" : ""}
    >
    ${starred ? "★" : "☆"}
    </button>`;

    const articleHead =
        `<h2 class="article-title">${title}</h2>`;
    const hostname = new URL(url).hostname;
    const backButton = `<span class="nav-button" id="back-button" onclick=history.back();>Back</span>`;
    const home = `<a class="nav-button" href="/">Home</a>`;

    let nav = ``;

    const referrer = document.referrer;

    if (referrer.startsWith(window.location.origin)) {
        nav = backButton;
    }
    else 
    {
        nav = home;
    }

    const myToolbar = 
        `<div class="article-toolbar"> 
        ${nav} 
        <a href="${url}" class="nav-button">Read on ${hostname}</a>
        ${starButton}
        </div>`;

    articleRoot.innerHTML =
        articleHead + myToolbar +
        `<div class="empty">Loading article ...</div>`;

    try {

        const response =
            await fetch(
                "/fetch?url=" +url
            );

        const result =
            await response.json();

        if (!result.success) {
            articleRoot.innerHTML =
                articleHead + myToolbar +
                `<div class="empty">
                    ${result.message || "Cannot load article"}
                </div>`;

            return;
        }

        const parser =
            new DOMParser();

        const doc =
            parser.parseFromString(
                result.data,
                "text/html"
            );
        
        const story = doc.querySelector("#section");
        
        //Remove script tags
        story.querySelectorAll("script").forEach(script => {
            script.remove();
        });

        // Correct lazy loaded images
        story.querySelectorAll("img").forEach(img => {

            const src =
                img.dataset.src ||
                img.dataset.lazySrc ||
                img.getAttribute("data-original");

            if (src) {
                img.src = src;
            }

        });


        story.querySelectorAll(
            `.ie-ie-share.m-preferred-new,
            h1[itemprop="headline"],
            .adboxtop, .main-heading-article, #main-heading-article, .article-main-head, .ie-breadcrumb, .share-box, .share-options, .ie-network-commenting,
             .alsoread-section, .ie-mobile-ad-carousel, .adboxtop, .desktop-full-ad,
             .most-read-container, .copyright figure, .storytags,
             .article-body-readmore,
             .myie-express-article-widget, .rightpanel `
        ).forEach(
            element => element.remove()
        );

  
        let articleContent = ``;
         articleContent += story.innerHTML;
        articleRoot.innerHTML =
            articleHead +
            myToolbar +
            articleContent;

    } catch (error) {

        console.error(error);

        articleRoot.innerHTML =
            articleHead + myToolbar +
            `<div class="empty">
                Cannot load article
            </div>`;
    }
}

// ==================================================
// START
// ==================================================

document.addEventListener("click", event => {
    const element = event.target.closest(".articles .title");

    if (element){

    let id = element.dataset.id;
    let url = element.dataset.url;
    let title = element.textContent.trim();

    if(! (id && url && title))
    {
        showAlert(false, "Cannot load article");
        return;
    }

    navigate('/article/'+url);
    return;
}

const button = event.target.closest(".star");

if(button)
{
  vote( button.dataset.id, button );
  return;
}


});

setCurrentDate();
clearOldStarred();
resolve();

