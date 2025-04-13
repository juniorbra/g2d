-- Create a table for user profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  full_name TEXT,
  birth_date DATE,
  phone TEXT,
  address TEXT
);

-- Create a table for knowledge base if it doesn't exist
CREATE TABLE IF NOT EXISTS g2d_kbase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Create a table for system prompt if it doesn't exist
CREATE TABLE IF NOT EXISTS g2d_systemprompt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_g2d_kbase_updated_at ON g2d_kbase;
CREATE TRIGGER update_g2d_kbase_updated_at
BEFORE UPDATE ON g2d_kbase
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_g2d_systemprompt_updated_at ON g2d_systemprompt;
CREATE TRIGGER update_g2d_systemprompt_updated_at
BEFORE UPDATE ON g2d_systemprompt
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE g2d_kbase ENABLE ROW LEVEL SECURITY;
ALTER TABLE g2d_systemprompt ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles if they don't exist
-- Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for g2d_kbase if they don't exist
-- All authenticated users can view knowledge base entries
DROP POLICY IF EXISTS "All users can view knowledge base" ON g2d_kbase;
CREATE POLICY "All users can view knowledge base"
  ON g2d_kbase FOR SELECT
  TO authenticated
  USING (true);

-- Only creators can update their own entries
DROP POLICY IF EXISTS "Users can update their own knowledge base entries" ON g2d_kbase;
CREATE POLICY "Users can update their own knowledge base entries"
  ON g2d_kbase FOR UPDATE
  USING (auth.uid() = created_by);

-- Only creators can delete their own entries
DROP POLICY IF EXISTS "Users can delete their own knowledge base entries" ON g2d_kbase;
CREATE POLICY "Users can delete their own knowledge base entries"
  ON g2d_kbase FOR DELETE
  USING (auth.uid() = created_by);

-- All authenticated users can insert new entries
DROP POLICY IF EXISTS "All users can insert knowledge base entries" ON g2d_kbase;
CREATE POLICY "All users can insert knowledge base entries"
  ON g2d_kbase FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for g2d_systemprompt if they don't exist
-- All authenticated users can view system prompt
DROP POLICY IF EXISTS "All users can view system prompt" ON g2d_systemprompt;
CREATE POLICY "All users can view system prompt"
  ON g2d_systemprompt FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can update system prompt (since there's typically only one)
DROP POLICY IF EXISTS "All users can manage system prompt" ON g2d_systemprompt;
CREATE POLICY "All users can manage system prompt"
  ON g2d_systemprompt FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create or replace a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
