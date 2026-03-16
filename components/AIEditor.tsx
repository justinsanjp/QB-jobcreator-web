import { useState, useRef, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { X, Send, Settings, FileCode, MessageSquare, Loader2, Code2, Download, Upload } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JSZip from 'jszip';

interface AIEditorProps {
  files: GeneratedFile[];
  onUpdateFiles: (files: GeneratedFile[]) => void;
  onClose: () => void;
}

type Message = { role: 'user' | 'assistant', content: string };

const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'deepseek', name: 'Deepseek' },
  { id: 'perplexity', name: 'Perplexity' },
  { id: 'klexai', name: 'KlexAI' }
];

const MODELS: Record<string, { id: string, name: string }[]> = {
  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
  ],
  anthropic: [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'o3-mini', name: 'o3-mini' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'Deepseek V3' },
    { id: 'deepseek-reasoner', name: 'Deepseek R1' }
  ],
  perplexity: [
    { id: 'sonar-pro', name: 'Sonar Pro' }
  ],
  klexai: [
    { id: 'Klexai 4.5-code', name: 'Klexai 4.5-code' },
    { id: 'KlexAI 4.5 pro', name: 'KlexAI 4.5 pro' },
    { id: 'KlexAI 4.5 flash', name: 'KlexAI 4.5 flash' },
    { id: 'KlexAI 5.2', name: 'KlexAI 5.2' }
  ]
};

export default function AIEditor({ files, onUpdateFiles, onClose }: AIEditorProps) {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [provider, setProvider] = useState('google');
  const [model, setModel] = useState(MODELS['google'][0].id);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update model list when provider changes
  useEffect(() => {
    setModel(MODELS[provider][0].id);
  }, [provider]);

  const handleFileChange = (newContent: string) => {
    const newFiles = [...files];
    newFiles[selectedFileIndex] = { ...newFiles[selectedFileIndex], content: newContent };
    onUpdateFiles(newFiles);
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.filename, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-edited-job.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const newCustomFiles: GeneratedFile[] = [];
      
      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('text');
          newCustomFiles.push({
            filename: filename.split('/').pop() || filename,
            content,
            language: filename.endsWith('.sql') ? 'sql' : 'lua'
          });
        }
      }
      
      if (newCustomFiles.length > 0) {
        onUpdateFiles(newCustomFiles);
        setSelectedFileIndex(0);
      }
    } catch (err) {
      console.error("Failed to import zip", err);
      alert("Failed to import ZIP file.");
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);

    const systemPrompt = `You are an expert FiveM QB-Core developer acting as an autonomous agent.
You are assisting the user in an IDE-like environment.
You MUST carefully analyze the provided codebase before making any changes.
Here is the complete current codebase of the project:
${JSON.stringify(files.map(f => ({ name: f.filename, content: f.content })))}

When the user asks you to modify the code, you MUST return your modifications in a JSON block formatted exactly like this:
\`\`\`json
{
  "edits": [
    {
      "name": "filename.lua",
      "content": "new full content of the file"
    }
  ]
}
\`\`\`
First, think step-by-step about what needs to be changed, taking the existing codebase into account, and explain your plan.
Then, provide the JSON block with the FULL updated content for any file you edit. Do not use partial snippets in the JSON.`;

    try {
      let responseText = '';
      let res: Response;

      if (provider === 'google') {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: newMessages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            }))
          })
        });
      } else if (provider === 'anthropic') {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4000,
            system: systemPrompt,
            messages: newMessages,
            stream: true
          })
        });
      } else {
        // OpenAI, Deepseek, Perplexity, KlexAI
        const baseUrl = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
                        provider === 'deepseek' ? 'https://api.deepseek.com/v1/chat/completions' :
                        provider === 'klexai' ? 'https://ai.justinsanjp.de/v1/chat/completions' :
                        'https://api.perplexity.ai/chat/completions';
        res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              ...newMessages
            ]
          })
        });
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      
      setMessages([...newMessages, { role: 'assistant', content: '' }]);
      setIsGenerating(false); // We are streaming now, so we can hide the "Thinking..." indicator

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              if (!dataStr) continue;
              try {
                const data = JSON.parse(dataStr);
                let textChunk = '';
                if (provider === 'google') {
                  textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else if (provider === 'anthropic') {
                  if (data.type === 'content_block_delta' && data.delta?.text) {
                    textChunk = data.delta.text;
                  }
                } else {
                  textChunk = data.choices?.[0]?.delta?.content || '';
                }
                if (textChunk) {
                  fullText += textChunk;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = fullText;
                    return updated;
                  });
                }
              } catch (e) {}
            }
          }
        }
      }
      responseText = fullText;

      // Parse edits
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
         try {
           const parsed = JSON.parse(jsonMatch[1]);
           if (parsed.edits && Array.isArray(parsed.edits)) {
              const newFiles = [...files];
              parsed.edits.forEach((edit: any) => {
                 const idx = newFiles.findIndex(f => f.filename === edit.name);
                 if (idx >= 0) {
                    newFiles[idx] = { ...newFiles[idx], content: edit.content };
                 } else {
                    newFiles.push({ filename: edit.name, content: edit.content, language: edit.name.split('.').pop() || 'text' });
                 }
              });
              onUpdateFiles(newFiles);
           }
         } catch (e) {
           console.error("Failed to parse JSON edits", e);
         }
      }

      setMessages([...newMessages, { role: 'assistant', content: responseText }]);
    } catch (err: any) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: `**Error:** ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e] text-[#cccccc] font-sans">
      {/* Header */}
      <div className="h-12 bg-[#333333] flex items-center justify-between px-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">AI Editor</span>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".zip" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImportZip}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded bg-[#444444] hover:bg-[#555555] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import ZIP
          </button>
          <button 
            onClick={handleDownload}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <div className="w-px h-4 bg-[#555555] mx-1"></div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#444444] rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - File Explorer */}
        <div className="w-64 bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
          <div className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Explorer
          </div>
          <div className="flex-1 overflow-y-auto">
            {files.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left px-4 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                  selectedFileIndex === idx ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e] text-gray-400'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span className="truncate">{file.filename}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          <div className="h-10 bg-[#2d2d2d] flex items-center px-4">
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              {files[selectedFileIndex]?.filename}
            </span>
          </div>
          <textarea
            value={files[selectedFileIndex]?.content || ''}
            onChange={(e) => handleFileChange(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 resize-none focus:outline-none text-sm leading-relaxed"
          />
        </div>

        {/* Right Sidebar - AI Chat */}
        <div className="w-96 bg-[#252526] border-l border-[#3c3c3c] flex flex-col">
          
          {/* Settings Accordion */}
          <div className="border-b border-[#3c3c3c]">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#2a2d2e] transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                AI Settings
              </div>
            </button>
            
            {showSettings && (
              <div className="p-4 bg-[#1e1e1e] space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="text-gray-400">Provider</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-[#3c3c3c] border-none rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400">Model</label>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#3c3c3c] border-none rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {MODELS[provider]?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-400">API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API Key"
                    className="w-full bg-[#3c3c3c] border-none rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {provider === 'klexai' && (
                  <div className="text-xs text-gray-400 mt-2">
                    More infomations on <a href="https://klexai.justinsanjp.de" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://klexai.justinsanjp.de</a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Ask the AI to modify your files.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#3c3c3c] text-gray-200'
                }`}>
                  <div className="break-words prose prose-invert prose-sm max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {m.content.replace(/```json\s*[\s\S]*?\s*```/g, '\n*(Applied file edits)*\n')}
                    </Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-start">
                <div className="bg-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[#3c3c3c] bg-[#1e1e1e]">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={apiKey ? "Ask AI to edit code..." : "Enter API key first..."}
                disabled={!apiKey || isGenerating}
                className="w-full bg-[#3c3c3c] rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !apiKey || isGenerating}
                className="absolute bottom-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
