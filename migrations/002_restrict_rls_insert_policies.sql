-- Migration: Restrict RLS INSERT policies
-- Problem: INSERT policies used WITH CHECK (true) allowing anyone to insert
-- into forms, form_fields, users, etc. without restriction.
-- Solution: Restrict inserts to proper ownership or valid foreign keys.
--
-- Run this in Supabase SQL Editor:

-- 1. Users: only service_role can insert (registration goes through API)
DROP POLICY IF EXISTS "Allow insert for registration" ON users;
CREATE POLICY "Allow insert for registration"
  ON users FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

-- 2. Forms: user can only insert forms with their own user_id
DROP POLICY IF EXISTS "Allow insert forms" ON forms;
CREATE POLICY "Allow insert forms"
  ON forms FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text OR current_setting('role') = 'service_role');

-- 3. Form fields: can only insert into forms the user owns
DROP POLICY IF EXISTS "Allow insert form fields" ON form_fields;
CREATE POLICY "Allow insert form fields"
  ON form_fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_id
      AND (forms.user_id::text = auth.uid()::text OR current_setting('role') = 'service_role')
    )
    OR current_setting('role') = 'service_role'
  );

-- 4. Responses: can only insert for published forms
DROP POLICY IF EXISTS "Anyone can insert responses" ON responses;
CREATE POLICY "Anyone can insert responses"
  ON responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = form_id AND forms.status = 'published'
    )
    OR current_setting('role') = 'service_role'
  );

-- 5. Response answers: can only insert for responses on published forms
DROP POLICY IF EXISTS "Anyone can insert answers" ON response_answers;
CREATE POLICY "Anyone can insert answers"
  ON response_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses
      JOIN forms ON forms.id = responses.form_id
      WHERE responses.id = response_id AND forms.status = 'published'
    )
    OR current_setting('role') = 'service_role'
  );
