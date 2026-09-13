const allowedHosts = ["indianexpress.com"];


export async function fetchArticle(url) {

    console.log(url);
    const hostname =
        new URL(url).hostname.replace(/^www\./, "");

        
    console.log(hostname);

    if(!allowedHosts.includes(hostname))
    {
          throw new Error(
            `${hostname} source not allowed`
        );
    }


    const response = await fetch(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (compatible; TopNewsIndia/1.0)",
            "Accept":
                "text/html,application/xhtml+xml"
        }
    });


    if (!response.ok) {
        throw new Error(
            `Article returned HTTP ${response.status}`
        );
    }

    return response.text();

}

