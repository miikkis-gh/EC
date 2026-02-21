-- Product reviews table
CREATE TABLE IF NOT EXISTS product_review (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    product_id    TEXT NOT NULL,
    rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title         TEXT NOT NULL,
    content       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_review_product_id ON product_review(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_user_id ON product_review(user_id);
