import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { Session } from '@supabase/supabase-js'

type Profile = {
  id: string
  wa_number: string | null
  updated_at: string
}

export default function Whatsapp() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [countryCode, setCountryCode] = useState('55')
  const [cityCode, setCityCode] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
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
        
        // Se já existe um número de WhatsApp, formatar para exibição
        if (data.wa_number) {
          const phoneStr = data.wa_number.toString();
          
          // Assumindo formato 5521982280802
          if (phoneStr.length >= 12) {
            // Extrair os componentes
            const countryCodePart = phoneStr.substring(0, 2);
            const cityCodePart = phoneStr.substring(2, 4);
            const numberFirstPart = phoneStr.substring(4, phoneStr.length - 4);
            const numberLastPart = phoneStr.substring(phoneStr.length - 4);
            
            setCountryCode(countryCodePart);
            setCityCode(cityCodePart);
            setWhatsappNumber(numberFirstPart + '-' + numberLastPart);
          } else {
            // Se o formato não for o esperado, apenas exibir como está
            setWhatsappNumber(phoneStr);
          }
        }
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
            
            if (retryData.wa_number) {
              const phoneStr = retryData.wa_number.toString();
              
              if (phoneStr.length >= 12) {
                const countryCodePart = phoneStr.substring(0, 2);
                const cityCodePart = phoneStr.substring(2, 4);
                const numberFirstPart = phoneStr.substring(4, phoneStr.length - 4);
                const numberLastPart = phoneStr.substring(phoneStr.length - 4);
                
                setCountryCode(countryCodePart);
                setCityCode(cityCodePart);
                setWhatsappNumber(numberFirstPart + '-' + numberLastPart);
              } else {
                setWhatsappNumber(phoneStr);
              }
            }
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

  const handleCityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir apenas números e limitar a 2 dígitos
    const value = e.target.value.replace(/\D/g, '').substring(0, 2);
    setCityCode(value);
  }

  const handleWhatsappNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remover qualquer caractere que não seja número ou hífen
    let value = e.target.value.replace(/[^\d-]/g, '');
    
    // Se o usuário digitar o hífen, manter apenas um hífen na posição correta
    if (value.includes('-')) {
      // Remover todos os hífens e adicionar um na posição correta
      const digits = value.replace(/-/g, '');
      
      if (digits.length > 4) {
        // Colocar o hífen antes dos últimos 4 dígitos
        value = digits.substring(0, digits.length - 4) + '-' + digits.substring(digits.length - 4);
      } else {
        // Se tiver menos de 5 dígitos, não adicionar hífen ainda
        value = digits;
      }
    } else {
      // Se o número tiver pelo menos 5 dígitos, adicionar o hífen automaticamente
      if (value.length > 4) {
        value = value.substring(0, value.length - 4) + '-' + value.substring(value.length - 4);
      }
    }
    
    setWhatsappNumber(value);
  }

  const updateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cityCode.trim() || !whatsappNumber.trim()) {
      setMessage({ text: 'Por favor, preencha todos os campos', type: 'error' })
      return
    }
    
    try {
      setLoading(true)
      
      // Formatar o número para armazenamento: 5521982280802
      const formattedNumber = countryCode + cityCode + whatsappNumber.replace(/-/g, '');
      
      // Primeiro, verificar se o perfil existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
      
      if (existingProfile) {
        // Se o perfil existe, atualizar
        console.log('Atualizando perfil existente com número de WhatsApp:', formattedNumber);
        const { error } = await supabase
          .from('profiles')
          .update({
            wa_number: formattedNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', session?.user.id)
        
        if (error) throw error
      } else {
        // Se o perfil não existe, criar um novo
        console.log('Criando novo perfil com número de WhatsApp:', formattedNumber);
        const { error } = await supabase
          .from('profiles')
          .insert([{ 
            id: session?.user.id,
            wa_number: formattedNumber,
            updated_at: new Date().toISOString()
          }])
        
        if (error) throw error
      }
      
      // Verificar se o número foi realmente salvo
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('wa_number')
        .eq('id', session?.user.id)
        .single()
      
      if (verifyError) throw verifyError
      
      console.log('Número de WhatsApp verificado após salvar:', verifyProfile?.wa_number);
      
      if (!verifyProfile?.wa_number) {
        console.error('Número de WhatsApp não foi salvo corretamente!');
        setMessage({ text: 'Erro ao salvar o número. Por favor, tente novamente.', type: 'error' })
        return
      }
      
      // Recarregar os dados do perfil após a atualização
      fetchProfile(session as Session)
      
      setMessage({ text: 'Número de WhatsApp cadastrado com sucesso!', type: 'success' })
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
          <h1 className="text-2xl font-bold mb-6">Cadastro de WhatsApp</h1>
        
          {message && (
            <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={updateWhatsapp}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Número de WhatsApp
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-none">
                  <div className="flex items-center border rounded shadow px-3 py-2 bg-gray-100">
                    <span className="text-gray-700">+</span>
                    <input
                      className="w-8 bg-gray-100 text-gray-700 ml-1"
                      type="text"
                      value={countryCode}
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex-none">
                  <div className="flex items-center border rounded shadow px-3 py-2">
                    <span className="text-gray-700">(</span>
                    <input
                      className="w-8 text-gray-700"
                      type="text"
                      value={cityCode}
                      onChange={handleCityCodeChange}
                      placeholder=""
                      maxLength={2}
                    />
                    <span className="text-gray-700">)</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                    type="text"
                    value={whatsappNumber}
                    onChange={handleWhatsappNumberChange}
                    placeholder="98765-4321"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Exemplo: + 55 (21) 98765-4321
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
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
