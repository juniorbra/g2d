import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

type SystemPrompt = {
  id: string
  prompt: string
  created_at: string
  updated_at: string
  created_by: string
}

export default function Prompt() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        router.push('/')
      } else {
        // Passar a sessão diretamente para a função em vez de usar o estado
        fetchCurrentPrompt(session)
      }
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
      
      // Fetch prompt using the user ID from profiles
      const { data, error } = await supabase
        .from('prompt')
        .select('*')
        .eq('created_by', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro na consulta do prompt:', error);
        throw error;
      }
      
      if (data) {
        console.log('Prompt encontrado:', data.id);
        setPrompt(data.prompt || '')
        setCurrentPromptId(data.id)
      } else {
        console.log('Nenhum prompt encontrado para o usuário');
        setPrompt('')
        setCurrentPromptId(null)
      }
    } catch (error: any) {
      console.error('Erro ao buscar prompt do sistema:', error.message)
      setMessage({ text: `Erro ao buscar dados: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) {
      setMessage({ text: 'Por favor, preencha o prompt do sistema', type: 'error' })
      return
    }
    
    try {
      setLoading(true)
      
      if (!session?.user?.id) {
        throw new Error('ID do usuário não disponível. Por favor, faça login novamente.');
      }
      
      const userId = session.user.id;
      console.log('Usando ID do usuário da sessão:', userId);
      console.log('Salvando prompt para o usuário ID:', userId);
      
      // Check if user already has a prompt entry
      const { data: existingPrompt, error: checkError } = await supabase
        .from('prompt')
        .select('id')
        .eq('created_by', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar prompt existente:', checkError);
        throw checkError;
      }
      
      if (existingPrompt) {
        console.log('Atualizando prompt existente:', existingPrompt.id);
        // Update existing prompt
        const { error } = await supabase
          .from('prompt')
          .update({
            prompt,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrompt.id);
        
        if (error) {
          console.error('Erro ao atualizar prompt:', error);
          throw error;
        }
        
        setMessage({ text: 'Prompt do sistema atualizado com sucesso!', type: 'success' });
      } else {
        console.log('Criando novo prompt para o usuário');
        // Insert new prompt
        const { error } = await supabase
          .from('prompt')
          .insert([{
            prompt,
            created_by: userId
          }]);
        
        if (error) {
          console.error('Erro ao inserir prompt:', error);
          throw error;
        }
        
        setMessage({ text: 'Prompt do sistema adicionado com sucesso!', type: 'success' });
      }
      
      // Refresh to get the latest data
      fetchCurrentPrompt();
    } catch (error: any) {
      console.error('Erro ao salvar prompt:', error);
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Redirecionando para o login...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {session && <Navbar session={session} />}
      <div className="max-w-4xl mx-auto p-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Prompt do Sistema</h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Prompt do Sistema
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-48"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Digite o prompt do sistema para o agente IA"
              />
              <p className="text-sm text-gray-500 mt-1">
                Este é o prompt principal que define o comportamento do agente IA.
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
