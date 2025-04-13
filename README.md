# G2D Consultoria - Configurador de Agente IA

Sistema para configuração de um agente de IA para a G2D Consultoria. O sistema permite gerenciar prompts e base de conhecimento do agente.

## Configuração do Projeto

### Pré-requisitos

- Node.js (versão 14 ou superior)
- Conta no Supabase (https://supabase.com)

### Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

> **Nota**: Certifique-se de criar um projeto no Supabase e obter as credenciais necessárias.

### Configuração do Banco de Dados Supabase

1. Crie um novo projeto no Supabase
2. Vá para a seção SQL Editor no painel do Supabase
3. Crie uma nova query e cole o conteúdo do arquivo `supabase/migrations/20250413_g2d_schema.sql`
4. Execute a query para criar todas as tabelas e configurações necessárias

#### Usuários de Teste

Para criar usuários de teste, você pode usar o painel do Supabase:

1. Acesse a seção Authentication > Users no painel do Supabase
2. Clique em "Add User"
3. Insira as credenciais para o primeiro usuário:
   - **Email**: teste@exemplo.com
   - **Senha**: senha123
4. Clique em "Save"
5. Repita o processo para o segundo usuário:
   - **Email**: hvidigaljr@gmail.com
   - **Senha**: teste12345
6. Clique em "Save"

Alternativamente, você pode criar usuários através da interface de cadastro da aplicação.

O esquema do banco de dados inclui:

- **profiles**: Informações dos usuários
- **g2d_kbase**: Tabela para armazenar a base de conhecimento (perguntas e respostas)
- **g2d_systemprompt**: Tabela para armazenar o prompt do sistema

### Executando o Projeto

```bash
npm run dev
```

Acesse http://localhost:3000 no seu navegador.

## Funcionalidades

### Autenticação
- Login com email/senha
- Cadastro de novos usuários
- Recuperação de senha
- Gerenciamento de sessão

### Gerenciamento de Perfil
- Visualização e edição de informações pessoais
- Atualização de dados como nome, data de nascimento, telefone e endereço

### Configuração do Agente IA
- Cadastro de prompts e base de conhecimento para o agente
- Visualização de todos os prompts e conhecimentos cadastrados
- Edição e exclusão de entradas existentes
- Personalização do comportamento do agente de IA

## Estrutura do Projeto

- `/src/components`: Componentes React reutilizáveis
- `/src/lib`: Utilitários e configurações
- `/src/pages`: Páginas da aplicação
- `/src/styles`: Estilos globais
- `/supabase`: Migrações e configurações do Supabase

## Segurança

O projeto utiliza Row Level Security (RLS) do Supabase para garantir que os usuários só possam acessar seus próprios dados. As políticas de segurança estão definidas no arquivo de migração SQL.
