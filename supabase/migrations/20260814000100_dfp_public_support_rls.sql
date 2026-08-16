-- DFP FIX 18 — enable anonymous validated insert for public support requests.
-- Public visitors may create a support request through the approved path,
-- but may NOT read/update/delete stored enquiries (admin-only SELECT policy already exists).
CREATE POLICY digital_footprint_support_public_insert
ON public.digital_footprint_support
FOR INSERT TO anon
WITH CHECK (
  (char_length(trim(submitted_by)) >= 2 AND char_length(trim(submitted_by)) <= 120)
  AND (char_length(trim(submitted_email)) >= 5 AND char_length(trim(submitted_email)) <= 254)
  AND (submitted_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
  AND (coalesce(char_length(ticket_description), 0) <= 10000)
  AND (status = 'Open')
);