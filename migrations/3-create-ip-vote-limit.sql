CREATE TABLE ip_vote_limits (
    ip TEXT NOT NULL,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ip, date)
);

CREATE INDEX idx_ip_vote_limits_ip
ON ip_vote_limits(ip);