import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plug, PlugZap, Radio, Settings2, Send, Trash2, CheckCircle2, XCircle,
  Loader2, Server, KeyRound, Cpu, Thermometer, Hash, Bot, ScanSearch,
  FlaskConical, Play, Shield, Wrench, ClipboardCheck, Activity, Copy,
} from 'lucide-react';

type ConnState = 'disconnected' | 'connecting' | 'connected' | 'error';
type Transport = 'stdio' | 'sse' | 'http';

interface MCPServer {
  id: string;
  name: string;
  url: string;
  transport: Transport;
  state: ConnState;
  tools: number;
  latency: number;
  lastError?: string;
}

interface AgentConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  systemPrompt: string;
}

interface MCPMessage {
  id: string;
  ts: string;
  dir: 'in' | 'out';
  from: string;
  to: string;
  method: string;
  payload: string;
  status: 'ok' | 'error' | 'pending';
}

const MODELS = ['gpt-5.5', 'gpt-5-mini', 'claude-sonnet-4', 'gemini-2.5-pro', 'deepseek-r1'];

const DEFAULT_AGENTS: AgentConfig[] = [
  { id: 'analyzer',  name: 'Analyzer',  icon: ScanSearch,     model: 'gpt-5.5',        temperature: 0.1, maxTokens: 4096, enabled: true,  systemPrompt: '你是源码静态分析专家，抽取类/方法/CFG。' },
  { id: 'planner',   name: 'Planner',   icon: Cpu,            model: 'claude-sonnet-4',temperature: 0.3, maxTokens: 4096, enabled: true,  systemPrompt: '根据CFG与测试意图规划用例分层。' },
  { id: 'generator', name: 'Generator', icon: FlaskConical,   model: 'gpt-5.5',        temperature: 0.4, maxTokens: 8192, enabled: true,  systemPrompt: '合成 JUnit5 + Mockito 测试代码。' },
  { id: 'executor',  name: 'Executor',  icon: Play,           model: 'gpt-5-mini',     temperature: 0.0, maxTokens: 2048, enabled: true,  systemPrompt: '执行测试并采集 JaCoCo 覆盖率。' },
  { id: 'mutator',   name: 'Mutator',   icon: Shield,         model: 'gpt-5-mini',     temperature: 0.2, maxTokens: 3072, enabled: true,  systemPrompt: '运行 PIT 变异测试并定位幸存者。' },
  { id: 'fixer',     name: 'Fixer',     icon: Wrench,         model: 'claude-sonnet-4',temperature: 0.5, maxTokens: 6144, enabled: true,  systemPrompt: '为失败/幸存变异生成修复补丁。' },
  { id: 'reviewer',  name: 'Reviewer',  icon: ClipboardCheck, model: 'gpt-5.5',        temperature: 0.2, maxTokens: 4096, enabled: true,  systemPrompt: '按质量门禁评审覆盖/变异/断言指标。' },
];

const INITIAL_SERVERS: MCPServer[] = [
  { id: 's1', name: 'jacoco-mcp',   url: 'http://localhost:7801/mcp', transport: 'http',  state: 'connected',  tools: 6, latency: 42 },
  { id: 's2', name: 'pit-mutation', url: 'http://localhost:7802/sse', transport: 'sse',   state: 'connected',  tools: 4, latency: 68 },
  { id: 's3', name: 'ast-tools',    url: 'stdio://ast-server',        transport: 'stdio', state: 'connecting', tools: 0, latency: 0 },
];

const stateStyle: Record<ConnState, string> = {
  connected:    'text-success bg-success/10 border-success/30',
  connecting:   'text-warning bg-warning/10 border-warning/30',
  disconnected: 'text-muted-foreground bg-muted/40 border-border',
  error:        'text-destructive bg-destructive/10 border-destructive/30',
};

const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.' +
  String(new Date().getMilliseconds()).padStart(3, '0');

function seedMessages(): MCPMessage[] {
  return [
    { id: 'm1', ts: now(), dir: 'out', from: 'analyzer',  to: 'ast-tools',    method: 'tools/call:parseAST',      payload: '{"path":"src/main/java/**"}',           status: 'ok' },
    { id: 'm2', ts: now(), dir: 'in',  from: 'ast-tools', to: 'analyzer',     method: 'result',                    payload: '{"classes":6,"methods":24}',            status: 'ok' },
    { id: 'm3', ts: now(), dir: 'out', from: 'executor',  to: 'jacoco-mcp',   method: 'tools/call:runWithCoverage',payload: '{"module":"cart"}',                     status: 'ok' },
    { id: 'm4', ts: now(), dir: 'in',  from: 'jacoco-mcp',to: 'executor',     method: 'result',                    payload: '{"line":78,"branch":64,"inst":81}',     status: 'ok' },
    { id: 'm5', ts: now(), dir: 'out', from: 'mutator',   to: 'pit-mutation', method: 'tools/call:mutate',         payload: '{"operators":["CONDITIONAL","MATH"]}',  status: 'ok' },
  ];
}

export default function MCPPanel() {
  const [servers, setServers] = useState<MCPServer[]>(INITIAL_SERVERS);
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [messages, setMessages] = useState<MCPMessage[]>(seedMessages);
  const [selectedAgent, setSelectedAgent] = useState<string>('analyzer');
  const [newServer, setNewServer] = useState({ name: '', url: '', transport: 'http' as Transport });
  const streamRef = useRef<HTMLDivElement>(null);

  // Simulated live message stream
  useEffect(() => {
    const iv = setInterval(() => {
      const a = agents[Math.floor(Math.random() * agents.length)];
      const s = servers[Math.floor(Math.random() * servers.length)];
      if (!a.enabled || s.state !== 'connected') return;
      const methods = ['tools/list', 'tools/call:runTests', 'tools/call:coverage', 'tools/call:mutate', 'resources/read'];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const outMsg: MCPMessage = {
        id: 'o' + Date.now(), ts: now(), dir: 'out',
        from: a.id, to: s.name, method,
        payload: `{"agent":"${a.id}","model":"${a.model}","temp":${a.temperature}}`,
        status: 'pending',
      };
      setMessages(prev => [...prev.slice(-40), outMsg]);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'i' + Date.now(), ts: now(), dir: 'in',
          from: s.name, to: a.id, method: 'result',
          payload: `{"ok":true,"latency":${s.latency}}`,
          status: 'ok',
        }].slice(-40));
      }, 500 + Math.random() * 800);
    }, 3200);
    return () => clearInterval(iv);
  }, [agents, servers]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const totalTools = useMemo(
    () => servers.filter(s => s.state === 'connected').reduce((a, s) => a + s.tools, 0),
    [servers],
  );
  const connected = servers.filter(s => s.state === 'connected').length;

  function toggleConnect(id: string) {
    setServers(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.state === 'connected') return { ...s, state: 'disconnected', tools: 0, latency: 0 };
      return { ...s, state: 'connecting' };
    }));
    setTimeout(() => {
      setServers(prev => prev.map(s => s.id === id && s.state === 'connecting'
        ? { ...s, state: 'connected', tools: Math.floor(3 + Math.random() * 6), latency: Math.floor(30 + Math.random() * 80) }
        : s));
    }, 900);
  }

  function removeServer(id: string) { setServers(prev => prev.filter(s => s.id !== id)); }

  function addServer() {
    if (!newServer.name || !newServer.url) return;
    setServers(prev => [...prev, {
      id: 'n' + Date.now(), name: newServer.name, url: newServer.url,
      transport: newServer.transport, state: 'connecting', tools: 0, latency: 0,
    }]);
    setTimeout(() => {
      setServers(prev => prev.map(s => s.name === newServer.name
        ? { ...s, state: 'connected', tools: Math.floor(2 + Math.random() * 5), latency: Math.floor(40 + Math.random() * 90) }
        : s));
      setNewServer({ name: '', url: '', transport: 'http' });
    }, 1000);
  }

  const agent = agents.find(a => a.id === selectedAgent)!;
  function patchAgent(patch: Partial<AgentConfig>) {
    setAgents(prev => prev.map(a => a.id === selectedAgent ? { ...a, ...patch } : a));
  }

  function sendProbe() {
    const target = servers.find(s => s.state === 'connected');
    if (!target) return;
    setMessages(prev => [...prev, {
      id: 'p' + Date.now(), ts: now(), dir: 'out',
      from: agent.id, to: target.name, method: 'tools/list',
      payload: `{"probe":true,"agent":"${agent.id}"}`, status: 'pending',
    }].slice(-40));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-info/5 via-card to-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 bg-info/15 text-info"><PlugZap className="w-5 h-5" /></div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">MCP 接入 · 多智能体网关</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              通过 Model Context Protocol 将 Agent 连接到外部工具服务器：JaCoCo、PIT、AST 解析等，并集中配置 Agent 运行参数。
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">已连接</span>
            <span className="text-success">{connected}/{servers.length}</span>
            <span className="text-muted-foreground">可用工具</span>
            <span className="text-primary">{totalTools}</span>
            <span className="text-muted-foreground">Agent</span>
            <span className="text-foreground">{agents.filter(a => a.enabled).length}/{agents.length}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* MCP Servers */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">MCP 服务器连接</h3>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{servers.length} 个端点</span>
          </div>
          <div className="divide-y divide-border">
            {servers.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`rounded-md border p-1.5 ${stateStyle[s.state]}`}>
                  {s.state === 'connecting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : s.state === 'connected' ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : s.state === 'error' ? <XCircle className="w-3.5 h-3.5" />
                    : <Plug className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-foreground truncate">{s.name}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.transport}</span>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">{s.url}</p>
                </div>
                <div className="text-right text-[11px] font-mono shrink-0">
                  <div className="text-foreground">{s.tools} tools</div>
                  <div className="text-muted-foreground">{s.latency ? `${s.latency}ms` : '—'}</div>
                </div>
                <button
                  onClick={() => toggleConnect(s.id)}
                  className="text-[11px] font-mono px-2 py-1 rounded border border-border hover:bg-muted transition"
                >
                  {s.state === 'connected' ? '断开' : '连接'}
                </button>
                <button onClick={() => removeServer(s.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {/* Add server */}
          <div className="px-5 py-3 border-t border-border bg-muted/20 grid grid-cols-[1fr_1.5fr_auto_auto] gap-2">
            <input
              value={newServer.name} onChange={e => setNewServer(v => ({ ...v, name: e.target.value }))}
              placeholder="server name"
              className="text-xs font-mono bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={newServer.url} onChange={e => setNewServer(v => ({ ...v, url: e.target.value }))}
              placeholder="http://... | sse://... | stdio://..."
              className="text-xs font-mono bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={newServer.transport} onChange={e => setNewServer(v => ({ ...v, transport: e.target.value as Transport }))}
              className="text-xs font-mono bg-background border border-border rounded px-2 py-1.5"
            >
              <option value="http">http</option>
              <option value="sse">sse</option>
              <option value="stdio">stdio</option>
            </select>
            <button onClick={addServer} className="text-xs font-mono px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90">
              添加
            </button>
          </div>
        </div>

        {/* Agent Config */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-card-foreground">Agent 参数配置</h3>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {agents.filter(a => a.enabled).length} 启用
            </span>
          </div>
          <div className="p-3 border-b border-border flex flex-wrap gap-1.5">
            {agents.map(a => {
              const Icon = a.icon;
              const active = a.id === selectedAgent;
              return (
                <button
                  key={a.id} onClick={() => setSelectedAgent(a.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition ${
                    active ? 'bg-primary text-primary-foreground border-primary'
                           : a.enabled ? 'bg-secondary border-border hover:bg-muted'
                                       : 'bg-muted/30 text-muted-foreground border-border/60 opacity-60'
                  }`}
                >
                  <Icon className="w-3 h-3" />{a.name}
                </button>
              );
            })}
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <agent.icon className="w-4 h-4 text-primary" />{agent.name} Agent
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                <input type="checkbox" checked={agent.enabled}
                  onChange={e => patchAgent({ enabled: e.target.checked })}
                  className="accent-primary" />
                启用
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                  <Bot className="w-3 h-3" />模型
                </span>
                <select value={agent.model} onChange={e => patchAgent({ model: e.target.value })}
                  className="w-full text-xs font-mono bg-background border border-border rounded px-2 py-1.5">
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />Max Tokens
                </span>
                <input type="number" value={agent.maxTokens}
                  onChange={e => patchAgent({ maxTokens: Number(e.target.value) })}
                  className="w-full text-xs font-mono bg-background border border-border rounded px-2 py-1.5" />
              </label>
              <label className="col-span-2 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                  <Thermometer className="w-3 h-3" />Temperature · <span className="text-foreground font-mono">{agent.temperature.toFixed(2)}</span>
                </span>
                <input type="range" min={0} max={1} step={0.05} value={agent.temperature}
                  onChange={e => patchAgent({ temperature: Number(e.target.value) })}
                  className="w-full accent-primary" />
              </label>
              <label className="col-span-2 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />System Prompt
                </span>
                <textarea value={agent.systemPrompt}
                  onChange={e => patchAgent({ systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full text-xs font-mono bg-background border border-border rounded px-2 py-1.5 leading-relaxed resize-none" />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={sendProbe}
                className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90">
                <Send className="w-3.5 h-3.5" />发送探测 (tools/list)
              </button>
              <span className="text-[10px] font-mono text-muted-foreground">
                将以当前配置向已连接的 MCP 服务器发起一次请求
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message stream */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">MCP 消息流</h3>
          <span className="ml-2 text-[10px] font-mono text-muted-foreground inline-flex items-center gap-1">
            <Activity className="w-3 h-3" />实时 · JSON-RPC 2.0
          </span>
          <button onClick={() => setMessages([])}
            className="ml-auto text-[11px] font-mono px-2 py-1 rounded border border-border hover:bg-muted inline-flex items-center gap-1">
            <Trash2 className="w-3 h-3" />清空
          </button>
        </div>
        <div ref={streamRef} className="max-h-[320px] overflow-y-auto divide-y divide-border/60">
          {messages.map(m => (
            <motion.div key={m.id}
              initial={{ opacity: 0, x: m.dir === 'out' ? -6 : 6 }} animate={{ opacity: 1, x: 0 }}
              className="px-5 py-2 grid grid-cols-[80px_60px_1fr_auto] gap-3 items-center text-[11px] font-mono">
              <span className="text-muted-foreground">{m.ts}</span>
              <span className={`inline-flex items-center gap-1 justify-center px-1.5 py-0.5 rounded border ${
                m.dir === 'out' ? 'text-info bg-info/10 border-info/30' : 'text-accent bg-accent/10 border-accent/30'
              }`}>
                {m.dir === 'out' ? '→ OUT' : '← IN'}
              </span>
              <div className="min-w-0">
                <div className="text-foreground truncate">
                  <span className="text-primary">{m.from}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="text-accent">{m.to}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span>{m.method}</span>
                </div>
                <div className="text-muted-foreground truncate">{m.payload}</div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                m.status === 'ok' ? 'text-success bg-success/10'
                  : m.status === 'error' ? 'text-destructive bg-destructive/10'
                  : 'text-warning bg-warning/10'
              }`}>
                {m.status === 'pending' ? <Loader2 className="w-3 h-3 animate-spin" />
                  : m.status === 'ok' ? <CheckCircle2 className="w-3 h-3" />
                  : <XCircle className="w-3 h-3" />}
                {m.status}
              </span>
            </motion.div>
          ))}
          {messages.length === 0 && (
            <div className="px-5 py-10 text-center text-xs font-mono text-muted-foreground">
              暂无消息，点击「发送探测」以生成一次请求
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
