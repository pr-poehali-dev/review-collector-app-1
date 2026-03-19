ALTER TABLE t_p75464024_review_collector_app.reviews
  ADD COLUMN IF NOT EXISTS ip varchar(45) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_ip_unique
  ON t_p75464024_review_collector_app.reviews (ip)
  WHERE ip IS NOT NULL;
