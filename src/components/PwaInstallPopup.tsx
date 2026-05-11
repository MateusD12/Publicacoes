import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const LS_KEY = 'pwa_install_dismissed'

export default function PwaInstallPopup() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
  }

  function handleDismiss() {
    localStorage.setItem(LS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
        <img
          src="/icons/icon-192.png"
          alt="Ícone do app"
          className="w-14 h-14 rounded-xl flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">Instalar Publicações</p>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight">
            Adicione à tela inicial para acesso rápido
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
