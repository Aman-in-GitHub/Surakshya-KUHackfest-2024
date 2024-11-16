-- Enable postgis
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Create Table
CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY,
    reporter_id uuid NOT NULL,
    date timestamptz DEFAULT CURRENT_TIMESTAMP,
    type report_type NOT NULL,
    location jsonb NOT NULL, 
    report text NOT NULL
);

-- Indexes
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_date ON reports(date);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;