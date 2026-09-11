const IST_TIME_ZONE = "Asia/Kolkata";

export function clean(value = "") {

    return value
        .replace(
            /<!\[CDATA\[([\s\S]*?)\]\]>/gi,
            "$1"
        )
        .replace(
            /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|rsquo|lsquo|rdquo|ldquo|ndash|mdash|hellip|copy|reg|trade|bull|middot);/gi,
            (match, entity) => {

                const namedEntities = {
                    amp: "&",
                    quot: '"',
                    apos: "'",
                    lt: "<",
                    gt: ">",
                    nbsp: "\u00A0",

                    rsquo: "\u2019",
                    lsquo: "\u2018",
                    rdquo: "\u201D",
                    ldquo: "\u201C",

                    ndash: "\u2013",
                    mdash: "\u2014",
                    hellip: "\u2026",

                    copy: "\u00A9",
                    reg: "\u00AE",
                    trade: "\u2122",
                    bull: "\u2022",
                    middot: "\u00B7",
                };


                // Named entity
                if (namedEntities[entity]) {
                    return namedEntities[entity];
                }


                // Hexadecimal entity
                // Example: &#x2019;
                if (
                    entity.startsWith("#x") ||
                    entity.startsWith("#X")
                ) {

                    const codePoint =
                        parseInt(
                            entity.slice(2),
                            16
                        );

                    if (
                        Number.isInteger(codePoint) &&
                        codePoint >= 0 &&
                        codePoint <= 0x10FFFF
                    ) {
                        return String.fromCodePoint(
                            codePoint
                        );
                    }

                    return match;
                }


                // Decimal entity
                // Example: &#8217;
                if (entity.startsWith("#")) {

                    const codePoint =
                        parseInt(
                            entity.slice(1),
                            10
                        );

                    if (
                        Number.isInteger(codePoint) &&
                        codePoint >= 0 &&
                        codePoint <= 0x10FFFF
                    ) {
                        return String.fromCodePoint(
                            codePoint
                        );
                    }
                }


                return match;
            }
        )
        .trim();
}

export function cleanHTML(value = "") {
    return clean(value)
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            ""
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            ""
        )
        .replace(
            /<[^>]+>/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

export function normalizeURL(value) {
    if (!value) {
        return "";
    }

    try {
        const url = new URL(value.trim());

        url.search = "";
        url.hash = "";

        return url.toString().replace(/\/$/, "");
    } catch {
        return value.trim().replace(/\/$/, "");
    }
}

export function getISTDateKey(date) {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: IST_TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(date);
}

export function getAllowedISTDates(now) {
    const today = getISTDateKey(now);

    const yesterday = getISTDateKey(
        new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );

    return new Set([today, yesterday]);
}