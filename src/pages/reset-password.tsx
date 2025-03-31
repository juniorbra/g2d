import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem', type: 'error' })
      return
    }
    
    if (newPassword.length < 6) {
      setMessage({ text: 'A senha deve ter pelo menos 6 caracteres', type: 'error' })
      return
    }
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setMessage({ text: 'Senha atualizada com sucesso!', type: 'success' })
      
      // Redirecionar para a página inicial após alguns segundos
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-sm text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">OGX Medical</h1>
        <p className="text-gray-600">Sistema de Configuração de Agente IA</p>
      </div>
      <div className="w-full max-w-sm">
        <form onSubmit={handleResetPassword} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4 text-center">Definir Nova Senha</h2>
          
          {message && (
            <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nova Senha
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Confirmar Nova Senha
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 py-2 px-4 rounded"
              onClick={() => router.push('/')}
            >
              Voltar ao login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
