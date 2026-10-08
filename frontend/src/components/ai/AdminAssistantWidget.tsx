import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, LoaderCircle, Send, Sparkles, X } from 'lucide-react';
import { adminAiApi } from '../../api';

type ChatRow = { role: 'user' | 'assistant'; content: string };

const quickPrompts = ['Tóm tắt doanh thu hôm nay', 'Sản phẩm nào sắp hết hàng?', 'Cho xem các đơn đang chờ'];

export function AdminAssistantWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<ChatRow[]>([
    { role: 'assistant', content: 'Mình có thể giúp bạn hiểu doanh thu, đơn hàng, tồn kho và khách hàng.' },
  ]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || busy) return;
    setMessage('');
    setRows(current => [...current, { role: 'user', content }, { role: 'assistant', content: '' }]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for await (const item of adminAiApi.stream(content, sessionId, controller.signal)) {
        if (item.Type === 'error') throw new Error(item.Error ?? 'AI tạm thời không khả dụng.');
        if (item.SessionId) setSessionId(item.SessionId);
        if (item.Text) setRows(current => current.map((row, index) => index === current.length - 1 ? { ...row, content: row.content + item.Text } : row));
      }
    } catch (error) {
      if (!controller.signal.aborted) setRows(current => current.map((row, index) => index === current.length - 1 ? { ...row, content: error instanceof Error ? error.message : 'AI tạm thời không khả dụng.' } : row));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  if (!open) return null;

  return <div className="fixed inset-0 z-50 md:pointer-events-none" role="dialog" aria-modal="true" aria-label="Trợ lý cửa hàng">
    <button type="button" aria-label="Đóng trợ lý AI" onClick={onClose} className="absolute inset-0 bg-zinc-950/30 md:hidden" />
    <aside className="pointer-events-auto absolute bottom-0 right-0 flex h-[min(760px,100vh)] w-full flex-col overflow-hidden rounded-t-3xl border-zinc-200 bg-white shadow-2xl md:bottom-5 md:right-5 md:h-[min(700px,calc(100vh-3rem))] md:w-[410px] md:rounded-3xl md:border">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf text-white"><Sparkles size={19} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-extrabold text-zinc-950">Trợ lý cửa hàng</h2><p className="text-xs text-zinc-500">Doanh thu, tồn kho, đơn hàng và khách hàng</p></div>
        {busy ? <LoaderCircle size={17} className="animate-spin text-leaf" /> : null}
        <button type="button" onClick={() => { abortRef.current?.abort(); onClose(); }} aria-label="Đóng" className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-50"><X size={18} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfb] p-4">
        {rows.map((row, index) => <div key={index} className={row.role === 'user' ? 'ml-8' : 'mr-5'}><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${row.role === 'user' ? 'rounded-br-md bg-zinc-950 text-white' : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-800'}`}>{row.role === 'assistant' ? <Bot size={15} className="mb-1 text-leaf" /> : null}{row.content || <span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:100ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:200ms]" /></span>}</div></div>)}
      </div>
      <div className="border-t border-zinc-100 bg-white px-4 py-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-400">Hỏi nhanh</p><div className="flex flex-wrap gap-1.5">{quickPrompts.map(prompt => <button type="button" key={prompt} onClick={() => setMessage(prompt)} disabled={busy} className="rounded-lg bg-zinc-50 px-2 py-1.5 text-left text-[11px] font-semibold text-zinc-600 hover:bg-leaf/10 hover:text-leaf disabled:opacity-50">{prompt}</button>)}</div></div>
      <form onSubmit={event => void send(event)} className="flex gap-2 border-t border-zinc-100 bg-white p-4"><input autoFocus value={message} onChange={event => setMessage(event.target.value)} placeholder="Hỏi về cửa hàng của bạn..." disabled={busy} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-leaf focus:bg-white" /><button type="submit" aria-label="Gửi tin nhắn" disabled={!message.trim() || busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf text-white transition hover:bg-leaf-dark disabled:bg-zinc-200"><Send size={17} /></button></form>
    </aside>
  </div>;
}
