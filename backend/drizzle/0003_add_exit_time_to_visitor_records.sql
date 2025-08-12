-- Migration: Add exit_time column to visitor_records table
-- This migration adds an exit_time timestamp column to track when visitors leave

ALTER TABLE "visitor_records" ADD COLUMN "exit_time" timestamp; 