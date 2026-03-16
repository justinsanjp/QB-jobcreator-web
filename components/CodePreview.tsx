import React, { useState, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { Copy, Check, FileCode, Database, Terminal, Download } from 'lucide-react';
import { downloadZip } from '../services/zipService';

interface CodePreviewProps {
  files: GeneratedFile[];
  jobName?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ files, jobName = 'custom-job' }) => {
  // Safe initialization
  const [activeFile, setActiveFile] = useState<string>(() => (files && files.length > 0) ? files[0].filename : '');
  const [copied, setCopied] = useState(false);

  // Sync activeFile if files array changes and activeFile is missing
  useEffect(() => {
    if (files && files.length > 0) {
       const exists = files.find(f => f.filename === activeFile);
       if (!exists) {
         setActiveFile(files[0].filename);
       }
    }
  }, [files, activeFile]);

  // Handle empty state safely
  if (!files || files.length === 0) {
    return (
        <div className="bg-[#1e1e2e] border border-slate-700 rounded-xl shadow-xl flex flex-col h-full overflow-hidden items-center justify-center">
            <span className="text-gray-500">No content generated</span>
        </div>
    );
  }

  const currentFile = files.find(f => f.filename === activeFile) || files[0];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadZip(jobName, files);
  };

  const getIcon = (name: string, lang: string) => {
    if (lang === 'sql') return <Database className="w-4 h-4 text-yellow-400" />;
    if (name.includes('config')) return <Terminal className="w-4 h-4 text-purple-400" />;
    return <FileCode className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="bg-[#1e1e2e] border border-slate-700 rounded-xl shadow-xl flex flex-col h-full overflow-hidden">
      {/* File Tabs */}
      <div className="flex overflow-x-auto bg-[#181825] border-b border-slate-700 scrollbar-hide">
        {files.map((file) => (
          <button
            key={file.filename}
            onClick={() => setActiveFile(file.filename)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-mono whitespace-nowrap border-r border-slate-800 transition-colors ${
              (currentFile && currentFile.filename === file.filename)
                ? 'bg-[#1e1e2e] text-white border-t-2 border-t-qb-accent' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1e1e2e]/50'
            }`}
          >
            {getIcon(file.filename, file.language)}
            {file.filename}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e2e] border-b border-white/5">
        <div className="text-xs text-gray-500 font-mono">
          {currentFile ? currentFile.filename : ''}
        </div>
        <div className="flex gap-2">
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-qb-accent/10 hover:bg-qb-accent/20 text-qb-accent rounded-lg text-xs transition-all border border-qb-accent/20"
                title="Download as .zip"
            >
                <Download className="w-3 h-3" />
                Download Resource
            </button>
            <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-xs transition-all border border-white/10"
            >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
      </div>
      
      {/* Code Area */}
      <div className="relative flex-1 bg-[#1e1e2e] overflow-hidden group">
        <pre className="h-full overflow-auto p-6 text-sm font-mono leading-relaxed text-[#cdd6f4]">
          <code className={`language-${currentFile ? currentFile.language : 'lua'}`}>
            {currentFile ? currentFile.content : ''}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;