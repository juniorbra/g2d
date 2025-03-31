-- Renomear as tabelas existentes
ALTER TABLE IF EXISTS public.system_prompt RENAME TO ogx_system_prompt;
ALTER TABLE IF EXISTS public.knowledge_base RENAME TO ogx_knowledge_base;
ALTER TABLE IF EXISTS public.profiles RENAME TO ogx_profiles;

-- Renomear as sequências (se existirem)
ALTER SEQUENCE IF EXISTS system_prompt_id_seq RENAME TO ogx_system_prompt_id_seq;
ALTER SEQUENCE IF EXISTS knowledge_base_id_seq RENAME TO ogx_knowledge_base_id_seq;
ALTER SEQUENCE IF EXISTS profiles_id_seq RENAME TO ogx_profiles_id_seq;

-- Atualizar as referências da foreign key
ALTER TABLE IF EXISTS public.ogx_system_prompt
  DROP CONSTRAINT IF EXISTS ogx_system_prompt_created_by_fkey,
  ADD CONSTRAINT ogx_system_prompt_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES ogx_profiles(id);

ALTER TABLE IF EXISTS public.ogx_knowledge_base
  DROP CONSTRAINT IF EXISTS ogx_knowledge_base_created_by_fkey,
  ADD CONSTRAINT ogx_knowledge_base_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES ogx_profiles(id);

-- Recriar as políticas de segurança
-- Políticas para ogx_system_prompt
DROP POLICY IF EXISTS "Todos podem ver o prompt do sistema" ON public.ogx_system_prompt;
DROP POLICY IF EXISTS "Admins podem gerenciar o prompt do sistema" ON public.ogx_system_prompt;

-- Nova política: qualquer usuário autenticado pode fazer tudo
CREATE POLICY "Usuários autenticados podem gerenciar o prompt do sistema"
  ON public.ogx_system_prompt FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para ogx_knowledge_base
DROP POLICY IF EXISTS "Todos podem ver a base de conhecimento" ON public.ogx_knowledge_base;
CREATE POLICY "Todos podem ver a base de conhecimento"
  ON public.ogx_knowledge_base FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias entradas" ON public.ogx_knowledge_base;
CREATE POLICY "Usuários podem atualizar suas próprias entradas"
  ON public.ogx_knowledge_base FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias entradas" ON public.ogx_knowledge_base;
CREATE POLICY "Usuários podem deletar suas próprias entradas"
  ON public.ogx_knowledge_base FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Usuários podem inserir na base de conhecimento" ON public.ogx_knowledge_base;
CREATE POLICY "Usuários podem inserir na base de conhecimento"
  ON public.ogx_knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Atualizar o perfil do usuário para admin
UPDATE ogx_profiles
SET profile_type = 'admin'
WHERE id = auth.uid();
