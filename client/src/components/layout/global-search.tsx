import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Building2, Users, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: number;
  label: string;
  sub: string;
  type: "client" | "debtor" | "debt";
}

interface SearchResponse {
  clients: SearchResult[];
  debtors: SearchResult[];
  debts: SearchResult[];
}

const TYPE_ICON = {
  client: Building2,
  debtor: Users,
  debt: FileText,
};
const TYPE_LABEL = {
  client: "Cliente",
  debtor: "Deudor",
  debt: "Adeudo",
};
const TYPE_PATH = {
  client: "/clients",
  debtor: "/debtors",
  debt: "/debtors",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setIsOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) {
        const data: SearchResponse = await res.json();
        const all = [...data.clients, ...data.debtors, ...data.debts];
        setResults(all);
        setIsOpen(all.length > 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (r: SearchResult) => {
    setQuery("");
    setIsOpen(false);
    navigate(`${TYPE_PATH[r.type]}/${r.id}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar clientes, deudores…"
          className="pl-8 pr-8 h-8 text-sm bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-primary-500"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Buscando…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Sin resultados</div>
          ) : (
            <ul>
              {results.map((r, i) => {
                const Icon = TYPE_ICON[r.type];
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="shrink-0 w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.label}</p>
                        <p className="text-xs text-gray-500 truncate">{r.sub}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{TYPE_LABEL[r.type]}</span>
                    </button>
                    {i < results.length - 1 && <div className="h-px bg-gray-100 mx-3" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
