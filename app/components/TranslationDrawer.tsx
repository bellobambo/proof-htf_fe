'use client'

import { useState } from 'react'
import { Drawer } from 'antd'
import { translateText } from '../actions/translate'

const languages = [
  { code: 'zh', name: 'Chinese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' }
]


export default function TranslationDrawer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [text, setText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [translatedText, setTranslatedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Please enter text to translate')
      return
    }

    setError('')
    setLoading(true)

    try {
      const result: any = await translateText(text, targetLanguage)
      if (result.success) {
        setTranslatedText(result.data)
      } else {
        setError('Translation failed')
      }
    } catch (error) {
      setError('Translation error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    setText('')
    setTranslatedText('')
    setError('')
  }

  return (
    <>
      {/* Translation Trigger Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="px-4 py-1 cursor-pointer bg-[#F5F5DC] text-[#8B4513] rounded-lg border border-[#8D6E63] hover:bg-[#8D6E63] hover:text-[#F5F5DC] transition-colors font-semibold flex items-center gap-2"
      >
        <img src="lingo.png" width={35} height={35} alt="" />
        <span>Translator</span>
      </button>


      {/* Ant Design Drawer */}
      <Drawer
        title={<span className="text-[#8B4513] text-xl">Text Translator</span>} placement="right"
        onClose={handleClose}
        open={isDrawerOpen}
        width={750}
        styles={{
          body: {
            backgroundColor: '#F5F5DC',
            padding: '24px'
          },
          header: {
            backgroundColor: '#F5F5DC',
            borderBottom: '1px solid #8D6E63'
          }
        }}
        closeIcon={
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M13 1L1 13M1 1L13 13"
              stroke="#8B4513"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      >
        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-[16px] font-semibold text-[#8B4513] mb-2">
              Target Language:
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-3 bg-[#F5F5DC] border border-[#8D6E63] rounded-lg text-[#8B4513] focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-[#8B4513]">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Text Area */}
          <div>
            <label className="block text-[16px] font-semibold text-[#8B4513] mb-2">
              Text to Translate:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to translate..."
              rows={6}
              className="w-full p-3 text-[16px] bg-[#F5F5DC] border border-[#8D6E63] rounded-lg text-[#8B4513] placeholder-[#8B4513] focus:outline-none focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-[#8B4513] rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={!text.trim() || loading}
            className="w-full p-3 bg-[#8B4513] cursor-pointer text-[#F5F5DC] rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6D4C41] transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#F5F5DC] border-t-transparent rounded-full animate-spin" />
                <span>Translating...</span>
              </div>
            ) : (
              'Translate'
            )}
          </button>

          {/* Translated Text Area */}
          {translatedText && (
            <div>
              <label className="block text-[16px] font-semibold text-[#8B4513] mb-2">
                Translated Text:
              </label>
              <textarea
                value={translatedText}
                readOnly
                rows={6}
                className="w-full p-3 text-[16px] bg-[#F5F5DC] border border-[#8D6E63] rounded-lg text-[#8B4513] resize-none"
              />
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
}