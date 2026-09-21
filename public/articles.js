
import {navigate, resolve, route} from "./router.js"

// ==================================================
// ARTICLES UI
// ==================================================


let articles = [];
let articlesLoaded = false;
let backURL = false;
let scrollY = new Map();
history.scrollRestoration = "manual";

function restoreScroll()
{       const key = window.location.hash.slice(1) || "/";
        if (scrollY.has(key)) {
        const targetY = scrollY.get(key);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo(0, targetY);
            });
        });
    }
}

function saveScrollPos()
{
    const key = window.location.hash.slice(1) || "/";
    if(!key.startsWith('/article/'))
    {
        scrollY.set(key, window.scrollY);
    }
}

function displayLoading()
{
    document.getElementById('app').style.display='none';
    document.getElementById('loading').style.display='flex';
}

function displayApp()
{

    document.getElementById('app').style.display='block';
    document.getElementById('loading').style.display='none';
}

route('/', async ({params, query})=>{
    displayLoading();
    setFilter('10');
    setView("article-list");
    await loadArticles();
    displayApp();
    
});

route('/all', async ({params, query})=>{
    displayLoading();
    setFilter('all');
    setView("article-list");
    await loadArticles('all');
    displayApp();
});

route('/editorial', async ({params, query})=>{
    displayLoading();
    setFilter('editorial');
    setView("article-list");
    await loadArticles('editorial');
    displayApp();
});

route('/explained', async ({params, query})=>{
    displayLoading();
    setFilter('explained');
    setView("article-list");
    await loadArticles('explained');
    displayApp();
});

route('/upsc', async ({params, query})=>{
    displayLoading();
    setFilter('upsc');
    setView("article-list");
    await loadArticles('upsc');
    displayApp();
});

route('/article/:url', async ({params, query})=>{
    displayLoading();
    setView("article-view");
    if(params.url)
    {
        await displayArticle(params.url);
    }
    else 
    {
        document.querySelector("#article-root").innerHTML(`<div class="empty">URL is required.</div>`);
    }
    displayApp();
    
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

    restoreScroll();
}


const container =
    document.getElementById("articles");

const filters =
    document.querySelectorAll(".filter");


function setCurrentDate() {

    const now = new Date();

    const parts = new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            hour12: false
        }
    ).formatToParts(now);

    const values = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
    );

    const date = new Date(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day)
    );

    if (Number(values.hour) < 7) {
        date.setDate(date.getDate() - 1);
    }

    document.getElementById("current-date").textContent =
        new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);
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

function showCategory(category)
{
    if(!category)
    {
        return '';
    }
const priorities = [
    { return: 'Lifestyle' },
    { remove: 'Cities' },
    { return: 'Sports' },
    { return: 'Entertainment' },
    { return: 'Trending' },
    { return: 'World' },
    { return: 'Explained' },
    { return: 'Technology' },
    { remove: 'Opinion' },
    { return: 'UPSC Essentials' }
];


for (const rule of priorities) {

    if (rule.return) {

        const found = category.find(item =>
            item.toLowerCase() === rule.return.toLowerCase()
        );

        if (found) {
            return found;
        }
    }

    if (rule.remove) {

        category = category.filter(item =>
            item.toLowerCase() !== rule.remove.toLowerCase()
        );
    }
}

return category.join(', ');

   
   
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
     else if (limit === "upsc") {

       
       visibleArticles = articles.filter(article =>
        article.metadata?.category?.some(category =>
            category.startsWith("UPSC")
        )
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
                                href="#/article/${escapeHTML(article.url)}"
                                data-url="${escapeHTML(article.url)}"
                                data-id="${article.id}"
                
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

                                ${
                                    article.metadata
                                        ? `
                                            <span class="meta-divider"></span>

                                            <span class="meta-item">
                                               ${showCategory(article.metadata.category)}
                                            </span>

                                            ${
                                                article.metadata.author
                                                    ? `
                                                        <span class="meta-divider"></span>
                                                        <span class="meta-item">
                                                            ${article.metadata.author}
                                                        </span>
                                                    `
                                                    : ""
                                            }
                                        `
                                        : ""
                                }

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


        // Adding total votes in DOM
        const totalVotes = articles.reduce(
            (total, item) => total + Number(item.votes || 0),
            0
        );
        document.getElementById("total-votes").innerHTML = totalVotes;
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


const articleRoot = document.getElementById("article-root");
  try {
   let article = false;
   let article_content = false;
   const url = articleUrl;

   let result = false;
   if(!articlesLoaded)
    {
      
        const [response1, response2] = await Promise.all([
          loadArticles(),
          fetch("/fetch?url=" +url)
        ]);

        result = await response2.json();
        
       
    }
    else 
    {
        const response2 = await fetch("/fetch?url=" +url);
        result = await response2.json();
    
    }

    if (!result.success) {
        articleRoot.innerHTML =
            `<div class="empty">
                ${result.message || "Cannot load article"}
            </div>`;

        return;
    }

    article_content  = result.data;

     const parser =
            new DOMParser();

    const doc =
        parser.parseFromString(
            article_content ,
            "text/html"
        );
    
    const story = doc.querySelector("#section");
        


    article =
        articles.find(article => {
            if (article.url === articleUrl) {
                return true;
            }
        });

    let title = '';
    let starred = false;
    let starButton = '';
    
    if(article)
    {
        title = article.title;
        starred =  isArticleStarred(Number(article.id));
        starButton = `
        <button
        class="star ${starred ? "active" : ""}"
        data-id="${article.id}"
        aria-label="Vote for article"
        title="${starred ? "Already voted" : "Vote"}"
        ${starred ? "disabled" : ""}
        >
        ${starred ? "★" : "☆"}
        </button>`;
    }
    else 
    {
       let t =
    doc.querySelector('.article-main-head') ||
    doc.querySelector('.main-heading-article') ||
    doc.querySelector('#main-heading-article');

    if (t) {
    [...t.children].forEach(child => child.remove());
    title = t.textContent.trim();
    } else {
        title = "";
    }

}
    

    const articleHead =
        `<h2 class="article-title">${title}</h2>`;
    const hostname = new URL(url).hostname;
    const backButton = `<span class="nav-button" id="back-button" onclick=history.back();>Back</span>`;
    const home = `<a class="nav-button" href="/">Home</a>`;

    let nav = ``;

    

    if (backURL) {
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

 

       
        //Remove script and style tags
        story.querySelectorAll("script, style").forEach(script => {
            script.remove();
        });


        //For lazy loading other tags
        story.querySelectorAll("[data-src]").forEach(element => {
            element.setAttribute("src", element.dataset.src);
        });

        story.querySelectorAll(
            `.ie-ie-share.m-preferred-new,
            h1[itemprop="headline"],
            .adboxtop, .main-heading-article, #main-heading-article, .article-main-head, .ie-breadcrumb, .share-box, .share-options, .ie-network-commenting,
             .alsoread-section, .ie-mobile-ad-carousel, .adboxtop, .desktop-full-ad,
             .most-read-container, .copyright figure, .storytags,
             .article-body-readmore, .ie-newsletter-widget,
             .mostread-mobile-section, .leave-comment,
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
    event.preventDefault();
    let id = element.dataset.id;
    let url = element.dataset.url;
    let title = element.textContent.trim();

    if(! (id && url && title))
    {
        showAlert(false, "Cannot load article");
        return;
    }

    saveScrollPos();
    backURL = window.location.pathname;
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

