CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    published_time TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_articles_date
ON articles(date);