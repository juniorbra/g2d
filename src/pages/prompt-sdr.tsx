import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

type SystemPrompt = {
  id: string
  prompt_sdr: string
  created_at: string
  updated_at: string
  created_by: string
}

export default function PromptSDR() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [promptSdr, setPromptSdr] = useState('')
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        if (!session) {
          router.push('/')
        } else {
          // Passar a sessão diretamente para a função em vez de usar o estado
          fetchCurrentPrompt(session)
        }
      }).catch(err => {
        console.error("Erro na autenticação:", err)
        setMessage({ text: "Erro na autenticação. Tente novamente.", type: 'error' })
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (!session) {
          router.push('/')
        }
      })

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error("Erro no useEffect:", err)
      setMessage({ text: "Ocorreu um erro inesperado. Tente novamente.", type: 'error' })
    }
  }, [router])

  const fetchCurrentPrompt = async (currentSession = session) => {
    try {
      setLoading(true)
      
      if (!currentSession?.user?.id) {
        console.error('ID do usuário não disponível na sessão');
        throw new Error('ID do usuário não disponível. Por favor, faça login novamente.');
      }
      
      const userId = currentSession.user.id;
      console.log('Usando ID do usuário da sessão:', userId);
      console.log('Buscando prompt SDR para o usuário ID:', userId);
      
      // Fetch prompt using the user ID from profiles
      const { data, error } = await supabase
        .from('prompt')
        .select('id, prompt_sdr')
        .eq('created_by', userId)
        .limit(1);
      
      if (error) {
        console.error('Erro na consulta do prompt SDR:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('Prompt SDR encontrado:', data[0].id);
        setPromptSdr(data[0].prompt_sdr || '');
        setCurrentPromptId(data[0].id);
      } else {
        console.log('Nenhum prompt SDR encontrado para o usuário');
        setPromptSdr('');
        setCurrentPromptId(null);
      }
    } catch (error: any) {
      console.error('Erro ao buscar prompt SDR:', error.message);
      setMessage({ 
        text: `Não foi possível carregar o prompt SDR. ${error.code === 'PGRST116' ? 'Nenhum registro encontrado.' : 'Tente novamente mais tarde.'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!promptSdr.trim()) {
      setMessage({ text: 'Por favor, preencha o prompt SDR', type: 'error' })
      return
    }
    
    // Confirmação antes de salvar
    if (!confirm('Tem certeza que deseja salvar as alterações?')) {
      return
    }
    
    try {
      setLoading(true)
      
      if (!session?.user?.id) {
        throw new Error('ID do usuário não disponível. Por favor, faça login novamente.');
      }
      
      const userId = session.user.id;
      console.log('Usando ID do usuário da sessão:', userId);
      console.log('Salvando prompt SDR para o usuário ID:', userId);
      
      // Check if user already has a prompt entry
      const { data: existingPrompt, error: checkError } = await supabase
        .from('prompt')
        .select('id, prompt')
        .eq('created_by', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar prompt existente:', checkError);
        throw checkError;
      }
      
      if (existingPrompt) {
        console.log('Atualizando prompt SDR existente:', existingPrompt.id);
        // Update existing prompt
        const { error } = await supabase
          .from('prompt')
          .update({
            prompt_sdr: promptSdr
            // Removido updated_at: new Date().toISOString() - já é tratado pelo trigger no banco
          })
          .eq('id', existingPrompt.id);
        
        if (error) {
          console.error('Erro ao atualizar prompt SDR:', error);
          throw error;
        }
        
        setMessage({ text: 'Prompt SDR atualizado com sucesso!', type: 'success' });
      } else {
        console.log('Criando novo prompt SDR para o usuário');
        // Insert new prompt
        const { error } = await supabase
          .from('prompt')
          .insert([{
            prompt: '', // Valor padrão para o campo obrigatório
            prompt_sdr: promptSdr,
            created_by: userId
          }]);
        
        if (error) {
          console.error('Erro ao inserir prompt SDR:', error);
          throw error;
        }
        
        setMessage({ text: 'Prompt SDR adicionado com sucesso!', type: 'success' });
      }
      
      // Refresh to get the latest data
      fetchCurrentPrompt();
    } catch (error: any) {
      console.error('Erro ao salvar prompt SDR:', error);
      setMessage({ 
        text: `Não foi possível salvar o prompt SDR. Por favor, tente novamente mais tarde.`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return <div>Redirecionando para o login...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {session && <Navbar session={session} />}
      <div className="max-w-4xl mx-auto p-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Prompt SDR</h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        {loading && (
          <div className="bg-white shadow-md rounded p-6 mb-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        )}
        
        <div className={`bg-white shadow-md rounded p-6 mb-6 ${loading ? 'opacity-50' : ''}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Prompt SDR
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-48"
                value={promptSdr}
                onChange={(e) => setPromptSdr(e.target.value)}
                placeholder="Digite o prompt SDR para o agente IA"
              />
              <p className="text-sm text-gray-500 mt-1">
                Este é o prompt específico para SDR que define o comportamento do agente IA.
              </p>
            </div>
            
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
