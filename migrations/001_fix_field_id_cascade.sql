-- Migration: Fix response_answers.field_id foreign key constraint
-- Problem: field_id references form_fields(id) WITHOUT ON DELETE CASCADE/SET NULL,
-- which blocks deletion of form_fields that have associated response_answers.
-- Solution: Change to ON DELETE SET NULL so deleting a field nullifies the reference
-- instead of blocking the operation.
--
-- Run this in Supabase SQL Editor:

-- Step 1: Drop the existing constraint
ALTER TABLE response_answers DROP CONSTRAINT IF EXISTS response_answers_field_id_fkey;

-- Step 2: Allow NULL values in field_id (previously NOT NULL)
ALTER TABLE response_answers ALTER COLUMN field_id DROP NOT NULL;

-- Step 3: Re-create the constraint with ON DELETE SET NULL
ALTER TABLE response_answers
  ADD CONSTRAINT response_answers_field_id_fkey
  FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE SET NULL;

-- Step 4: Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON form_fields(form_id, "order");
CREATE INDEX IF NOT EXISTS idx_response_answers_answered_at ON response_answers(answered_at);
