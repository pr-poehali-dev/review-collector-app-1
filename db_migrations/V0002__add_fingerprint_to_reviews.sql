ALTER TABLE t_p75464024_review_collector_app.reviews
ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(64) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_fingerprint_unique
ON t_p75464024_review_collector_app.reviews (fingerprint)
WHERE fingerprint IS NOT NULL;
