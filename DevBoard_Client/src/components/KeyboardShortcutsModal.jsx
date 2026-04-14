import { useState, useEffect } from 'react'

const shortcuts = [
  { category: 'Navigation',   keys: [['G'], ['→ Dashboard']],   desc: 'Go to dashboard'  },
  { category: 'Navigation',   keys: [['A'], ['→ Analytics']],   desc: 'Go to analytics'  },
  { category: 'Navigation',   keys: [['P'], ['→ Profile']],     desc: 'Go to profile'    },
  { category: 'Actions',      keys: [['N']],                    desc: 'New project'      },
  { category: 'Actions',      keys: [['T']],                    desc: 'New task'         },
  { category: 'Actions',      keys: [['F']],                    desc: 'Focus search'     },
  { category: 'Actions',      keys: [['E']],                    desc: 'Export to CSV'    },
  { category: 'Actions',      keys: [['Esc']],                  desc: 'Close modal'      },
  { category: 'Help',         keys: [['?']],                    desc: 'Show shortcuts'   },
]

const KeyboardShortcutsModal = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = () => setShow(true)
    window.addEventListener('show-shortcuts', handler)

    // Also close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') setShow(false)
    }
    window.addEventListener('keydown', escHandler)

    return () => {
      window.removeEventListener('show-shortcuts', handler)
      window.removeEventListener('keydown', escHandler)
    }
  }, [])

  if (!show) return null

  const categories = [...new Set(shortcuts.map((s) => s.category))]

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-semibold">Keyboard shortcuts</h2>
          <button onClick={() => setShow(false)} className="text-gray-500 hover:text-white text-2xl leading-none">x</button>
        </div>

        <div className="space-y-5">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{shortcut.desc}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((keyGroup, ki) => (
                          <div key={ki} className="flex items-center gap-1">
                            {keyGroup.map((key, kj) => (
                              key.startsWith('→') ? (
                                <span key={kj} className="text-gray-500 text-xs">{key}</span>
                              ) : (
                                <kbd
                                  key={kj}
                                  className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded-md font-mono"
                                >
                                  {key}
                                </kbd>
                              )
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-6 text-center">
          Press <kbd className="bg-gray-800 border border-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded font-mono">?</kbd> anywhere to show this
        </p>
      </div>
    </div>
  )
}

export default KeyboardShortcutsModal