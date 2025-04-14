import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

type KnowledgeEntry = {
  id: string
  question: string
  answer: string
  created_at: string
  updated_at: string
  created_by: string
}

export default function BaseDeConhecimento() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        router.push('/')
      } else {
        fetchEntries()
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

  const fetchEntries = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('g2d_kbase')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data) {
        setEntries(data)
      }
    } catch (error: any) {
      console.error('Erro ao buscar base de conhecimento:', error.message)
      setMessage({ text: `Erro ao buscar dados: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pergunta.trim() || !resposta.trim()) {
      setMessage({ text: 'Por favor, preencha todos os campos', type: 'error' })
      return
    }
    
    try {
      setLoading(true)
      
      if (editingId) {
        // Update existing entry
        const { error } = await supabase
          .from('g2d_kbase')
          .update({
            question: pergunta,
            answer: resposta,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)
        
        if (error) throw error
        
        setMessage({ text: 'Entrada atualizada com sucesso!', type: 'success' })
        setEditingId(null)
      } else {
        // Insert new entry
        const { error } = await supabase
          .from('g2d_kbase')
          .insert([{
            question: pergunta,
            answer: resposta,
            created_by: session?.user.id
          }])
        
        if (error) throw error
        
        setMessage({ text: 'Entrada adicionada com sucesso!', type: 'success' })
      }

      // Webhook notification
      try {
        await fetch('https://webhooks.botvance.com.br/webhook/5e16d45c-43af-g2d-consult-atualiza-kb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: pergunta,
            answer: resposta,
            action: editingId ? 'update' : 'create',
            entryId: editingId || 'new'
          })
        });
        console.log('Webhook de notificação enviado com sucesso');
      } catch (webhookError) {
        console.error('Erro ao enviar webhook de notificação:', webhookError);
        // Continue with the process even if webhook fails
      }
      
      // Reset form and refresh entries
      setPergunta('')
      setResposta('')
      fetchEntries()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id)
    setPergunta(entry.question)
    setResposta(entry.answer)
    window.scrollTo(0, 0)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('g2d_kbase')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setMessage({ text: 'Entrada excluída com sucesso!', type: 'success' })
      fetchEntries()
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setPergunta('')
    setResposta('')
  }

  if (!session) {
    return <div>Redirecionando para o login...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {session && <Navbar session={session} />}
      <div className="max-w-4xl mx-auto p-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Base de Conhecimento</h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Entrada' : 'Adicionar Nova Entrada'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Pergunta
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                type="text"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                placeholder="Digite a pergunta"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Resposta
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-32"
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Digite a resposta"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-4">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
              )}
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

        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4">Entradas Existentes</h2>
          {entries.length === 0 ? (
            <p className="text-gray-500">Nenhuma entrada encontrada.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border p-4 rounded">
                  <div className="mb-2">
                    <h3 className="font-bold">Pergunta:</h3>
                    <p>{entry.question}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold">Resposta:</h3>
                    <p>{entry.answer}</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
