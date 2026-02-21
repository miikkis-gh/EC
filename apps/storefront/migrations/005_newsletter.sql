-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscriber (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);
