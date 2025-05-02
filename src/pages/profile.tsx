import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

type Profile = {
  id: string
  full_name: string
  birth_date: string | null
  phone: string | null
  address: string | null
  wa_alert: string | null
  wagroup_alert: string | null
  updated_at: string
}

export default function Profile() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [waAlert, setWaAlert] = useState('')
  const [wagroupAlert, setWagroupAlert] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        router.push('/')
      } else {
        fetchProfile(session)
      }
    })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push('/')
      } else {
        fetchProfile(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const fetchProfile = async (session: Session) => {
    try {
      setLoading(true)
      
      // Verificar se o perfil já existe
      const { data, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      // Se o perfil existir, usar os dados existentes
      if (data) {
        console.log('Perfil encontrado:', data);
        setProfile(data)
        setFullName(data.full_name || '')
        setBirthDate(data.birth_date || '')
        setPhone(data.phone || '')
        setAddress(data.address || '')
        setWaAlert(data.wa_alert || '')
        setWagroupAlert(data.wagroup_alert || '')
      } 
      // Se o perfil não existir (erro PGRST116 = não encontrado), criar um novo
      else if (selectError && selectError.code === 'PGRST116') {
        console.log('Perfil não encontrado, criando novo perfil');
        
        // Verificar se já existe um perfil com este ID antes de criar
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('id', session.user.id)
        
        if (countError) throw countError
        
        // Só criar um novo perfil se realmente não existir
        if (count === 0) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: session.user.id }])
            .select()
          
          if (insertError) throw insertError
          
          if (newProfile && newProfile.length > 0) {
            setProfile(newProfile[0])
            // Inicializar os campos com valores vazios
            setFullName('')
            setBirthDate('')
            setPhone('')
            setAddress('')
            setWaAlert('')
            setWagroupAlert('')
          }
        } else {
          console.log('Perfil existe mas não foi possível recuperar, tentando novamente');
          // Se o perfil existe mas não conseguimos recuperar, tentar novamente
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (retryError) throw retryError
          
          if (retryData) {
            setProfile(retryData)
            setFullName(retryData.full_name || '')
            setBirthDate(retryData.birth_date || '')
            setPhone(retryData.phone || '')
            setAddress(retryData.address || '')
            setWaAlert(retryData.wa_alert || '')
            setWagroupAlert(retryData.wagroup_alert || '')
          }
        }
      } 
      // Para outros erros, lançar exceção
      else if (selectError) {
        throw selectError
      }
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Buscar o perfil atual para preservar o número de telefone se não foi alterado
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single()
      
      // Se o campo de telefone estiver vazio e já existir um número no banco,
      // usar o número existente para não apagá-lo
      const phoneToUpdate = phone.trim() === '' && currentProfile?.phone 
        ? currentProfile.phone 
        : (phone || null)
      
      // Verificar se o perfil existe
      if (currentProfile) {
        // Se o perfil existe, atualizar
        console.log('Atualizando perfil existente');
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            birth_date: birthDate || null,
            phone: phoneToUpdate,
            address: address || null,
            wa_alert: waAlert || null,
            wagroup_alert: wagroupAlert || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', session?.user.id)
        
        if (error) throw error
      } else if (fetchError && fetchError.code === 'PGRST116') {
        // Se o perfil não existe, criar um novo
        console.log('Criando novo perfil');
        const { error } = await supabase
          .from('profiles')
          .insert([{ 
            id: session?.user.id,
            full_name: fullName,
            birth_date: birthDate || null,
            phone: phoneToUpdate,
            address: address || null,
            wa_alert: waAlert || null,
            wagroup_alert: wagroupAlert || null,
            updated_at: new Date().toISOString()
          }])
        
        if (error) throw error
      } else if (fetchError) {
        throw fetchError
      }
      
      // Verificar se o perfil foi realmente salvo
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single()
      
      if (verifyError) throw verifyError
      
      console.log('Perfil verificado após salvar:', verifyProfile);
      
      // Recarregar os dados do perfil após a atualização
      fetchProfile(session as Session)
      
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' })
    } catch (error: any) {
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
      <div className="max-w-md mx-auto p-4 pt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Seu Perfil</h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={updateProfile}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100"
              type="email"
              value={session.user.email}
              disabled
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nome Completo
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Data de Nascimento
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Telefone
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Endereço
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Alerta WhatsApp (número)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="text"
              value={waAlert}
              onChange={(e) => setWaAlert(e.target.value)}
              placeholder="Ex: +5511999999999"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Alerta grupo WhatsApp (descrição do grupo)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              type="text"
              value={wagroupAlert}
              onChange={(e) => setWagroupAlert(e.target.value)}
              placeholder="Ex: Grupo de Alertas G2D"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
