import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

export default function ResetMemory() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [countryCode, setCountryCode] = useState('55')
  const [areaCode, setAreaCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        router.push('/')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!areaCode.trim() || !phoneNumber.trim()) {
      setMessage({ text: 'Por favor, preencha todos os campos do telefone', type: 'error' })
      return
    }

    const fullPhoneNumber = `${countryCode}${areaCode}${phoneNumber}`
    
    try {
      setLoading(true)
      // Webhook da G2D Consultoria para limpar memória
      const response = await fetch('https://webhooks.botvance.com.br/webhook/f8d87a85-aecf-42bd-a1ad-g2dconsult-limpar-memoria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar requisição')
      }

      setMessage({ text: 'Solicitação enviada com sucesso!', type: 'success' })
      setAreaCode('')
      setPhoneNumber('')
    } catch (error: any) {
      console.error('Erro ao enviar número:', error)
      setMessage({ text: 'Erro ao enviar solicitação. Por favor, tente novamente.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar session={session} />
      
      <div className="max-w-4xl mx-auto p-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Resetar Memória</h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white shadow-md rounded p-6">
          <p className="text-gray-600 mb-6">
            Clique no botão abaixo para limpar o histórico de mensagens do agente de IA
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <div className="w-full md:w-32">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-center"
                  placeholder="55"
                  disabled
                />
              </div>
              
              <div className="w-full md:w-32">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  DDD
                </label>
                <input
                  type="text"
                  value={areaCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 2) {
                      setAreaCode(value)
                    }
                  }}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-center"
                  placeholder="21"
                  maxLength={2}
                />
              </div>
              
              <div className="w-full md:w-64">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Número
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 9) {
                      setPhoneNumber(value)
                    }
                  }}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-center"
                  placeholder="982280802"
                  maxLength={9}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Enviando...' : 'Limpar Memória'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
