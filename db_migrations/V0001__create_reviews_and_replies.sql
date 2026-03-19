
CREATE TABLE IF NOT EXISTS t_p75464024_review_collector_app.reviews (
  id SERIAL PRIMARY KEY,
  author VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'Сайт',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p75464024_review_collector_app.replies (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES t_p75464024_review_collector_app.reviews(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
