-- ============================================
-- SUPABASE DATA EXPORT AND DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. CHECK ALL USERS AND THEIR DATA COUNTS
SELECT 
  s.user_id,
  au.email,
  COUNT(DISTINCT s.id) as section_count,
  COUNT(DISTINCT sub.id) as subsection_count,
  COUNT(DISTINCT t.id) as task_count
FROM sections s
LEFT JOIN auth.users au ON au.id = s.user_id
LEFT JOIN subsections sub ON sub.section_id = s.id
LEFT JOIN tasks t ON t.subsection_id = sub.id
GROUP BY s.user_id, au.email
ORDER BY section_count DESC;

-- 2. VIEW ALL SECTIONS WITH THEIR SUBSECTIONS AND TASKS
SELECT 
  s.user_id,
  au.email as user_email,
  s.id as section_id,
  s.title as section_title,
  s.color as section_color,
  s.high_priority as section_high_priority,
  sub.id as subsection_id,
  sub.title as subsection_title,
  sub.high_priority as subsection_high_priority,
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.high_priority as task_high_priority,
  t.completed
FROM sections s
LEFT JOIN auth.users au ON au.id = s.user_id
LEFT JOIN subsections sub ON sub.section_id = s.id
LEFT JOIN tasks t ON t.subsection_id = sub.id
ORDER BY s.user_id, s.title, sub.title, t.title;

-- 3. EXPORT DATA FOR A SPECIFIC USER (replace USER_ID with actual UUID)
-- This creates a JSON structure similar to the app format
WITH user_sections AS (
  SELECT 
    id, user_id, title, color, high_priority
  FROM sections 
  WHERE user_id = 'YOUR_USER_ID_HERE'
),
user_subsections AS (
  SELECT 
    sub.id, sub.section_id, sub.title, sub.high_priority
  FROM subsections sub
  JOIN user_sections us ON us.id = sub.section_id
),
user_tasks AS (
  SELECT 
    t.id, t.subsection_id, t.title, t.due_date, t.high_priority, t.completed
  FROM tasks t
  JOIN user_subsections usub ON usub.id = t.subsection_id
)
SELECT 
  jsonb_build_object(
    'userId', us.user_id,
    'exportDate', now(),
    'sections', jsonb_agg(
      jsonb_build_object(
        'id', us.id,
        'title', us.title,
        'color', us.color,
        'high_priority', us.high_priority,
        'subsections', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', usub.id,
              'title', usub.title,
              'high_priority', usub.high_priority,
              'tasks', (
                SELECT COALESCE(jsonb_agg(
                  jsonb_build_object(
                    'id', ut.id,
                    'title', ut.title,
                    'dueDate', ut.due_date,
                    'high_priority', ut.high_priority
                  )
                ), '[]'::jsonb)
                FROM user_tasks ut
                WHERE ut.subsection_id = usub.id
              )
            )
          )
          FROM user_subsections usub
          WHERE usub.section_id = us.id
        )
      )
    )
  ) as user_data
FROM user_sections us
GROUP BY us.user_id;

-- 4. CHECK FOR ORPHANED DATA (subsections without parent sections)
SELECT 
  sub.id as subsection_id,
  sub.title as subsection_title,
  sub.section_id,
  CASE WHEN s.id IS NULL THEN 'ORPHANED' ELSE 'OK' END as status
FROM subsections sub
LEFT JOIN sections s ON s.id = sub.section_id
WHERE s.id IS NULL;

-- 5. CHECK FOR ORPHANED TASKS (tasks without parent subsections)
SELECT 
  t.id as task_id,
  t.title as task_title,
  t.subsection_id,
  CASE WHEN sub.id IS NULL THEN 'ORPHANED' ELSE 'OK' END as status
FROM tasks t
LEFT JOIN subsections sub ON sub.id = t.subsection_id
WHERE sub.id IS NULL;

-- 6. CHECK RLS POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('sections', 'subsections', 'tasks')
ORDER BY tablename, policyname;

-- 7. GET LIST OF ALL USERS WITH THEIR IDS
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 8. EXPORT COMPLETE DATABASE DUMP (FOR BACKUP)
-- Run this to get all data for all users
SELECT jsonb_build_object(
  'exportDate', now(),
  'sections', (SELECT jsonb_agg(row_to_json(sections.*)) FROM sections),
  'subsections', (SELECT jsonb_agg(row_to_json(subsections.*)) FROM subsections),
  'tasks', (SELECT jsonb_agg(row_to_json(tasks.*)) FROM tasks)
) as complete_backup;

-- ============================================
-- REPAIR QUERIES (USE WITH CAUTION)
-- ============================================

-- 9. RECREATE RLS POLICIES (if they were accidentally dropped)
-- Run these one by one

-- For sections
-- DROP POLICY IF EXISTS "Users can view their own sections" ON public.sections;
-- CREATE POLICY "Users can view their own sections" 
-- ON public.sections FOR SELECT 
-- USING (auth.uid() = user_id);

-- For subsections
-- DROP POLICY IF EXISTS "Users can view subsections of their sections" ON public.subsections;
-- CREATE POLICY "Users can view subsections of their sections" 
-- ON public.subsections FOR SELECT 
-- USING (EXISTS (
--   SELECT 1 FROM public.sections 
--   WHERE sections.id = subsections.section_id 
--   AND sections.user_id = auth.uid()
-- ));

-- For tasks
-- DROP POLICY IF EXISTS "Users can view tasks in their subsections" ON public.tasks;
-- CREATE POLICY "Users can view tasks in their subsections" 
-- ON public.tasks FOR SELECT 
-- USING (EXISTS (
--   SELECT 1 FROM public.subsections 
--   JOIN public.sections ON sections.id = subsections.section_id
--   WHERE subsections.id = tasks.subsection_id 
--   AND sections.user_id = auth.uid()
-- ));

