import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Auth from '../components/Auth'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('test').select('*')
        if (error) {
          console.error('Erro de conexão:', error)
        } else {
          console.log('Conexão bem sucedida!')
        }
      } catch (err) {
        console.error('Erro:', err)
      }
    }
    
    testConnection()
  }, [])

  // Redirecionar para a página de prompt se estiver logado
  useEffect(() => {
    if (session) {
      router.push('/prompt')
    }
  }, [session, router])

  return (
    <div className="min-h-screen bg-gray-100">
      {!session ? (
        <Auth />
      ) : (
        <div>
          <Navbar session={session} />
          <div className="p-8 max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Bem-vindo ao Sistema de Configuração de Agente IA da G2D Consultoria</h1>
              <p className="text-lg text-gray-600 mb-8">Você está sendo redirecionado para a página de configuração...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
