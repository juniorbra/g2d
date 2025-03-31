-- Create a table for user profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  full_name TEXT,
  birth_date DATE,
  phone TEXT,
  address TEXT,
  profile_type TEXT CHECK (profile_type IN ('patient', 'doctor', 'admin')),
  specialty TEXT, -- For doctors
  license_number TEXT, -- For doctors
  avatar_url TEXT
);

-- Create a table for AI agent configuration if it doesn't exist
CREATE TABLE IF NOT EXISTS ogx_medical (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt TEXT NOT NULL,
  conhecimento TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Create a simple test table for connection testing if it doesn't exist
CREATE TABLE IF NOT EXISTS test (
  id SERIAL PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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

DROP TRIGGER IF EXISTS update_ogx_medical_updated_at ON ogx_medical;
CREATE TRIGGER update_ogx_medical_updated_at
BEFORE UPDATE ON ogx_medical
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ogx_medical ENABLE ROW LEVEL SECURITY;
ALTER TABLE test ENABLE ROW LEVEL SECURITY;

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

-- Create policies for ogx_medical if they don't exist
-- All authenticated users can view agent configurations
DROP POLICY IF EXISTS "All users can view medical knowledge" ON ogx_medical;
CREATE POLICY "All users can view agent configurations"
  ON ogx_medical FOR SELECT
  TO authenticated
  USING (true);

-- Only creators can update their own entries
DROP POLICY IF EXISTS "Users can update their own medical knowledge entries" ON ogx_medical;
CREATE POLICY "Users can update their own agent configurations"
  ON ogx_medical FOR UPDATE
  USING (auth.uid() = created_by);

-- Only creators can delete their own entries
DROP POLICY IF EXISTS "Users can delete their own medical knowledge entries" ON ogx_medical;
CREATE POLICY "Users can delete their own agent configurations"
  ON ogx_medical FOR DELETE
  USING (auth.uid() = created_by);

-- All authenticated users can insert new entries
DROP POLICY IF EXISTS "All users can insert medical knowledge" ON ogx_medical;
CREATE POLICY "All users can insert agent configurations"
  ON ogx_medical FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for test table (allow all authenticated users to select)
DROP POLICY IF EXISTS "Allow all authenticated users to select from test" ON test;
CREATE POLICY "Allow all authenticated users to select from test"
  ON test FOR SELECT
  TO authenticated
  USING (true);

-- Insert some test data if the table is empty
INSERT INTO test (name)
SELECT 'Test Connection'
WHERE NOT EXISTS (SELECT 1 FROM test WHERE name = 'Test Connection');

-- Note: For creating test users, it's recommended to use the Supabase UI or API
-- instead of direct SQL insertion, as the auth schema may vary between Supabase versions.
-- 
-- To create test users:
-- 1. Go to Authentication > Users in the Supabase dashboard
-- 2. Click "Add User"
-- 3. Enter email: teste@exemplo.com and password: senha123
-- 4. Click "Save"
-- 5. Repeat for the second user:
-- 6. Click "Add User"
-- 7. Enter email: hvidigaljr@gmail.com and password: teste12345
-- 8. Click "Save"
--
-- Alternatively, you can use the Supabase API:
-- supabase.auth.signUp({
--   email: 'teste@exemplo.com',
--   password: 'senha123',
--   options: {
--     data: {
--       full_name: 'Usuário de Teste'
--     }
--   }
-- })
--
-- supabase.auth.signUp({
--   email: 'hvidigaljr@gmail.com',
--   password: 'teste12345',
--   options: {
--     data: {
--       full_name: 'Henrique Vidiga Jr'
--     }
--   }
-- })
--
-- After creating the users, you can manually insert profiles if needed:
-- INSERT INTO profiles (id, full_name, profile_type)
-- VALUES ([user1_id], 'Usuário de Teste', 'patient');
--
-- INSERT INTO profiles (id, full_name, profile_type)
-- VALUES ([user2_id], 'Henrique Vidiga Jr', 'patient');

-- Insert some test agent configurations if entries don't exist
-- Note: These will be inserted without a creator reference initially
-- After creating a user, you can update these entries to associate them with the user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ogx_medical WHERE prompt = 'Quais produtos vocês oferecem para procedimentos de preenchimento facial?') THEN
    INSERT INTO ogx_medical (
      prompt,
      conhecimento
    ) VALUES (
      'Quais produtos vocês oferecem para procedimentos de preenchimento facial?',
      'A OGX Medical oferece uma linha completa de produtos para preenchimento facial, incluindo:\n\n1. Ácido Hialurônico OGX Fill (disponível em densidades variadas para diferentes regiões do rosto)\n2. Bioestimuladores de colágeno\n3. Cânulas e agulhas específicas para aplicação\n4. Kits completos para procedimentos estéticos\n\nTodos os nossos produtos são certificados pela ANVISA e possuem garantia de qualidade. Oferecemos treinamento especializado para profissionais que adquirem nossos produtos de preenchimento facial.'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM ogx_medical WHERE prompt = 'Como funciona o processo de compra e entrega dos equipamentos?') THEN
    INSERT INTO ogx_medical (
      prompt,
      conhecimento
    ) VALUES (
      'Como funciona o processo de compra e entrega dos equipamentos?',
      'O processo de compra e entrega dos equipamentos da OGX Medical segue estas etapas:\n\n1. Solicitação de orçamento através do site ou contato direto com um consultor\n2. Análise personalizada das necessidades da sua clínica\n3. Proposta comercial detalhada com opções de pagamento (à vista, parcelado ou leasing)\n4. Confirmação do pedido e pagamento\n5. Prazo de entrega entre 7 a 15 dias úteis, dependendo da região\n6. Instalação e treinamento inclusos para equipamentos de maior complexidade\n7. Suporte técnico pós-venda e garantia de 12 meses\n\nPara equipamentos importados, o prazo de entrega pode ser estendido para 30-45 dias.'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM ogx_medical WHERE prompt = 'Quais são os equipamentos mais recomendados para uma clínica de estética iniciante?') THEN
    INSERT INTO ogx_medical (
      prompt,
      conhecimento
    ) VALUES (
      'Quais são os equipamentos mais recomendados para uma clínica de estética iniciante?',
      'Para clínicas de estética iniciantes, recomendamos os seguintes equipamentos essenciais da OGX Medical:\n\n1. OGX Laser Compact - equipamento multifuncional para depilação e rejuvenescimento\n2. OGX Dermo System - para limpeza de pele, peeling e hidratação\n3. OGX Body Sculpt Basic - para tratamentos corporais não invasivos\n4. Kit básico de instrumentais e consumíveis\n\nEste conjunto permite oferecer os tratamentos mais procurados com investimento inicial controlado. Oferecemos pacotes especiais para clínicas iniciantes com condições facilitadas de pagamento e treinamento completo da equipe. À medida que a clínica cresce, nossa linha de equipamentos avançados pode complementar o portfólio de serviços.'
    );
  END IF;
END $$;

-- After creating a user, you can run this to associate the entries with the user:
-- UPDATE ogx_medical SET created_by = '[user_id]' WHERE created_by IS NULL;

-- Create or replace a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, profile_type)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'patient');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
