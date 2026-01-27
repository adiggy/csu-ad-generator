-- Feedback table for CSU Ad Generator
-- Run this in your Neon SQL Editor to create the table

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    email VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),
    screen_size VARCHAR(50),
    window_size VARCHAR(50),
    current_settings VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying by type and date
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON feedback(submitted_at DESC);
