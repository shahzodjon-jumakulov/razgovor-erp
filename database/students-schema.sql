-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  tariff_id UUID NOT NULL REFERENCES tariffs(id) ON DELETE RESTRICT,
  tariff_price_id UUID NOT NULL REFERENCES tariff_prices(id) ON DELETE RESTRICT,
  group_code TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student payments table
CREATE TABLE IF NOT EXISTS student_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  payment_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  receipt_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate student code
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_code FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM students
  WHERE student_code ~ '^AC[0-9]+$';
  
  -- Generate the new code with zero padding
  new_code := 'AC' || LPAD(next_number::TEXT, 3, '0');
  
  -- Assign the new code to the record
  NEW.student_code := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate student code
DROP TRIGGER IF EXISTS trigger_generate_student_code ON students;
CREATE TRIGGER trigger_generate_student_code
  BEFORE INSERT ON students
  FOR EACH ROW
  WHEN (NEW.student_code IS NULL OR NEW.student_code = '')
  EXECUTE FUNCTION generate_student_code();

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Sales managers can only see their own students
CREATE POLICY "Sales managers can view their own students" ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('sales', 'head_sales')
      AND students.manager_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- RLS Policy: Sales managers can insert students assigned to themselves
CREATE POLICY "Sales managers can create students for themselves" ON students
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('sales', 'head_sales')
      AND students.manager_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- RLS Policy: Sales managers can update their own students
CREATE POLICY "Sales managers can update their own students" ON students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('sales', 'head_sales')
      AND students.manager_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- RLS Policy: Sales managers can delete their own students
CREATE POLICY "Sales managers can delete their own students" ON students
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('sales', 'head_sales')
      AND students.manager_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- Enable RLS on student_payments table
ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see payments for students they manage
CREATE POLICY "Users can view payments for their students" ON student_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE students.id = student_payments.student_id
      AND (
        (profiles.role IN ('sales', 'head_sales') AND students.manager_id = profiles.id)
        OR profiles.role = 'superadmin'
      )
    )
  );

-- RLS Policy: Users can insert payments for students they manage
CREATE POLICY "Users can create payments for their students" ON student_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE students.id = student_payments.student_id
      AND (
        (profiles.role IN ('sales', 'head_sales') AND students.manager_id = profiles.id)
        OR profiles.role = 'superadmin'
      )
    )
  );

-- RLS Policy: Users can update payments for students they manage
CREATE POLICY "Users can update payments for their students" ON student_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE students.id = student_payments.student_id
      AND (
        (profiles.role IN ('sales', 'head_sales') AND students.manager_id = profiles.id)
        OR profiles.role = 'superadmin'
      )
    )
  );

-- RLS Policy: Users can delete payments for students they manage
CREATE POLICY "Users can delete payments for their students" ON student_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM students 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE students.id = student_payments.student_id
      AND (
        (profiles.role IN ('sales', 'head_sales') AND students.manager_id = profiles.id)
        OR profiles.role = 'superadmin'
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_manager_id ON students(manager_id);
CREATE INDEX IF NOT EXISTS idx_students_tariff_id ON students(tariff_id);
CREATE INDEX IF NOT EXISTS idx_students_tariff_price_id ON students(tariff_price_id);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_student_payments_student_id ON student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_payment_date ON student_payments(payment_date);
