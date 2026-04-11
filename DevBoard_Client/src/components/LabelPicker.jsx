import { useState } from 'react'
import { LABEL_PRESETS } from '../utils/labelColors'

const LabelPicker = ({ selectedLabels = [], onChange }) => {
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customColor, setCustomColor] = useState('#6366f1')

  const isSelected = (name) =>
    selectedLabels.some((l) => l.name === name)

  const togglePreset = (preset) => {
    if (isSelected(preset.name)) {
      onChange(selectedLabels.filter((l) => l.name !== preset.name))
    } else {
      onChange([...selectedLabels, preset])
    }
  }

  const removeLabel = (name) => {
    onChange(selectedLabels.filter((l) => l.name !== name))
  }

  const addCustom = () => {
    if (!customName.trim()) return
    const exists = selectedLabels.some(
      (l) => l.name.toLowerCase() === customName.toLowerCase()
    )
    if (!exists) {
      onChange([...selectedLabels, { name: customName.trim().toLowerCase(), color: customColor }])
    }
    setCustomName('')
    setShowCustom(false)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Labels</label>

      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedLabels.map((label) => (
            <span
              key={label.name}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: label.color + '33', border: `1px solid ${label.color}66` }}
            >
              <span style={{ color: label.color }}>{label.name}</span>
              <button
                type="button"
                onClick={() => removeLabel(label.name)}
                style={{ color: label.color }}
                className="hover:opacity-70 transition leading-none"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset labels */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {LABEL_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => togglePreset(preset)}
            className={`text-xs px-2 py-1 rounded-full transition border ${
              isSelected(preset.name) ? 'opacity-100' : 'opacity-50 hover:opacity-75'
            }`}
            style={{
              backgroundColor: preset.color + '22',
              borderColor:     preset.color + '66',
              color:           preset.color,
            }}
          >
            {isSelected(preset.name) ? '✓ ' : ''}{preset.name}
          </button>
        ))}
      </div>

      {/* Custom label */}
      {showCustom ? (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Label name"
            maxLength={30}
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          />
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <button
            type="button"
            onClick={addCustom}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs transition"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className="text-gray-500 hover:text-white text-xs transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="text-xs text-gray-500 hover:text-indigo-400 transition mt-1"
        >
          + Custom label
        </button>
      )}
    </div>
  )
}

export default LabelPicker