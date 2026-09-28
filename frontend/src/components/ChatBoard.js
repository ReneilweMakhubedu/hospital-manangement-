import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { STARTERS, replyToMedicalQuestion } from '../medicalChat';

const WELCOME = {
  en: 'Sawubona. Ask a health question in English or siSwati. I give hospital guidance, not a diagnosis. Emergencies: go to Casualty.',
  ss: 'Sawubona. Buta umbuto wetemphilo ngesiNgisi noma ngesiSwati. Ngikunika luhlahlo, hhayi sikhatselo. Uma kuphutfuma, hamba eCasualty.',
};

export default function ChatBoard() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('auto');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: WELCOME.en, emergency: false },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const ask = (raw) => {
    const question = raw.trim();
    if (!question) return;
    const answer = replyToMedicalQuestion(question, lang === 'auto' ? null : lang);
    setMessages((current) => [
      ...current,
      { from: 'user', text: question },
      { from: 'bot', text: answer.text, emergency: answer.emergency },
    ]);
    setText('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          className="flex h-[32rem] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-lg"
          aria-label="Medical chat"
        >
          <header className="flex items-start justify-between gap-3 bg-[#e41e1f] px-4 py-3 text-[#ffffff]">
            <div>
              <p className="text-sm font-semibold">Health chat · English / siSwati</p>
              <p className="text-xs text-white/90">Guidance only · not a diagnosis</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/15" aria-label="Close chat">
              <X size={18} />
            </button>
          </header>

          <div className="flex gap-2 border-b border-[#8b8b8b]/20 bg-[#f8f8f8] px-3 py-2">
            {[
              { id: 'auto', label: 'Auto' },
              { id: 'en', label: 'English' },
              { id: 'ss', label: 'siSwati' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLang(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  lang === item.id ? 'bg-[#e41e1f] text-[#ffffff]' : 'bg-[#ffffff] text-[#1f1f1f]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f5f5] px-3 py-3">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.from === 'user'
                      ? 'bg-[#1f1f1f] text-[#ffffff]'
                      : message.emergency
                        ? 'border border-[#e41e1f] bg-[#ffffff] text-[#1f1f1f]'
                        : 'bg-[#ffffff] text-[#1f1f1f]'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[#8b8b8b]/20 bg-[#ffffff] px-3 py-2">
            {STARTERS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => ask(item.text)}
                className="shrink-0 rounded-full border border-[#8b8b8b]/40 px-3 py-1 text-xs text-[#1f1f1f] hover:bg-[#f8f8f8]"
              >
                {item.label}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-[#8b8b8b]/20 bg-[#ffffff] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              ask(text);
            }}
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={lang === 'ss' ? 'Bhala umbuto wakho…' : 'Ask in English or siSwati…'}
              className="min-w-0 flex-1 rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
            />
            <button type="submit" className="rounded-lg bg-[#e41e1f] px-3 text-[#ffffff]" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full bg-[#e41e1f] px-4 py-3 text-sm font-semibold text-[#ffffff] shadow-lg hover:opacity-90"
      >
        <MessageCircle size={18} />
        {open ? 'Close chat' : 'Health chat'}
      </button>
    </div>
  );
}
