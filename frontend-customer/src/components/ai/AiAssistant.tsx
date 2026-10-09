import { useRef, useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { apiClient } from "../../api";
import { errorMessage } from "../../lib";
import { useAuth, useCart, useToast } from "../../app/providers";
import { Button, Money, ProductImage } from "../store-ui";
import type { AiChatStreamEvent, ChatMessageDto, ProductSuggestionDto } from "../../types";
import { translator } from "../../lib/translator";

const t = translator;

function renderMarkdown(text: string) {
  const clean = text.replace(/\[ID:\d+(?:,QTY:\d+)?\]/g, "");
  const lines = clean.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <div key={index} className="flex gap-2">
          <span className="text-leaf">•</span>
          <span>{renderInline(trimmed.replace(/^[-*]\s+/, ""))}</span>
        </div>
      );
    }
    if (/^#{1,4}\s+/.test(trimmed)) {
      return <p key={index} className="font-extrabold text-ink">{renderInline(trimmed.replace(/^#{1,4}\s+/, ""))}</p>;
    }
    if (trimmed === "") return <div key={index} className="h-2" />;
    return <p key={index}>{renderInline(line)}</p>;
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return <code key={index} className="rounded bg-canvas px-1 font-mono text-[12px]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  });
}

type ChatRow = { role: "user" | "assistant"; content: string; suggestions?: ProductSuggestionDto[] };

export function AiAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const { refresh } = useCart();
  const { showToast } = useToast();
  const [rows, setRows] = useState<ChatRow[]>([{ role: "assistant", content: t("ai.greeting") }]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  if (!open) return null;
  const send = async () => {
    const content = message.trim();
    if (!content || busy) return;
    setMessage("");
    setRows((current) => [...current, { role: "user", content }, { role: "assistant", content: "" }]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const history: ChatMessageDto[] = rows.slice(-8).map((row) => ({ Role: row.role, Content: row.content }));
      let text = "";
      let suggestions: ProductSuggestionDto[] | undefined;
      for await (const event of apiClient.ai.stream({ Message: content, History: history }, controller.signal)) {
        if (event.Type === "error") throw new Error(event.Error ?? t("ai.unavailable"));
        if (event.Text) {
          text += event.Text;
          setRows((current) => current.map((row, index) => (index === current.length - 1 ? { ...row, content: text } : row)));
        }
        if (event.SuggestedProducts?.length) {
          suggestions = event.SuggestedProducts;
          setRows((current) => current.map((row, index) => (index === current.length - 1 ? { ...row, suggestions } : row)));
        }
      }
      if (!text) {
        const result = await apiClient.ai.chat({ Message: content, History: history });
        text = result.Message;
        suggestions = result.SuggestedProducts ?? undefined;
        setRows((current) =>
          current.map((row, index) =>
            index === current.length - 1 ? { ...row, content: text, suggestions } : row,
          ),
        );
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setRows((current) =>
          current.map((row, index) =>
            index === current.length - 1 ? { ...row, content: errorMessage(error, t("ai.unavailable")) } : row,
          ),
        );
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };
  const addAll = async (suggestions: ProductSuggestionDto[]) => {
    if (!isAuthenticated) {
      showToast(t("ai.signInToAdd"), "info");
      return;
    }
    try {
      const result = await apiClient.ai.addToCart({
        Products: suggestions.map((item) => ({ ProductId: item.ProductId, Quantity: item.SuggestedQuantity || 1 })),
      });
      await refresh();
      showToast(result.Message ?? t("ai.addedToCart"));
    } catch (error) {
      showToast(errorMessage(error, t("ai.addFailed")), "error");
    }
  };
  return (
    <div className="fixed inset-0 z-50 md:pointer-events-none">
      <button aria-label={t("ai.close")} onClick={onClose} className="absolute inset-0 bg-ink/30 md:hidden" />
      <aside className="pointer-events-auto absolute bottom-0 right-0 flex h-[min(760px,100vh)] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:bottom-5 md:right-5 md:h-[min(700px,calc(100vh-3rem))] md:w-[410px] md:rounded-3xl md:border md:border-line">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white">
            <Sparkles size={19} className="text-citrus" />
          </span>
          <div className="flex-1">
            <h2 className="text-sm font-extrabold text-ink"> {t("ai.title")}</h2>
            <p className="text-xs text-muted"> {t("ai.subtitle")}</p>
          </div>
          {busy && <LoaderCircle size={17} className="animate-spin text-leaf" />}
          <button
            onClick={() => {
              abortRef.current?.abort();
              onClose();
            }}
            aria-label={t("ai.close")}
            className="rounded-xl p-2 text-muted hover:bg-canvas"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfb] p-4">
          {rows.map((row, index) => (
            <div key={index} className={row.role === "user" ? "ml-8" : "mr-5"}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${row.role === "user" ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-white text-ink"}`}
              >
                {row.role === "assistant" && <Bot size={15} className="mb-1 text-leaf" />}
                {row.role === "assistant" ? (
                  <div className="space-y-1 whitespace-pre-wrap">{renderMarkdown(row.content || "…")}</div>
                ) : (
                  <span>{row.content}</span>
                )}
                {!row.content && (
                  <span className="inline-flex gap-1">
                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:100ms]" />
                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:200ms]" />
                  </span>
                )}
              </div>
              {row.suggestions && row.suggestions.length > 0 && (
                <div className="mt-2 rounded-2xl border border-[#cde7d3] bg-white p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-leaf"> {t("ai.suggestedBundle")}</p>
                  <div className="space-y-2">
                    {row.suggestions.map((item) => (
                      <div key={item.ProductId} className="flex items-center gap-2">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#f2f6f2]">
                          <ProductImage product={item as never} className="h-full w-full p-1" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.ProductName}</span>
                        <Money value={item.Price} className="text-xs font-bold text-leaf-dark" />
                      </div>
                    ))}
                  </div>
                  <Button className="mt-3 w-full py-2 text-xs" onClick={() => void addAll(row.suggestions!)}>
                    {" "}
                    {t("ai.addAll")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="flex gap-2 border-t border-line bg-white p-4"
        >
          <input
            autoFocus={false}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("ai.placeholder")}
            disabled={busy}
            className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-leaf focus:bg-white"
          />
          <button
            aria-label={t("ai.send")}
            disabled={!message.trim() || busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf text-white transition hover:bg-leaf-dark disabled:bg-gray-200"
          >
            <Send size={17} />
          </button>
        </form>
      </aside>
    </div>
  );
}
