import React, { useState, useEffect, useRef } from 'react';
import { JobData, GeneratedFile } from './types';
import JobForm from './components/JobForm';
import CodePreview from './components/CodePreview';
import AIEditor from './components/AIEditor';
import { generateAllFiles } from './services/generator';
import { Layers, Rocket, PenTool, Sparkles, Download, Upload } from 'lucide-react';
import JSZip from 'jszip';

const INITIAL_JOB: JobData = {
  name: 'mechanic',
  label: 'Mechanic',
  defaultDuty: true,
  offDutyPay: false,
  author: '',
  description: '',
  grades: [
    { level: 0, name: 'Recruit', payment: 50, isBoss: false },
    { level: 1, name: 'Novice', payment: 75, isBoss: false },
    { level: 2, name: 'Experienced', payment: 100, isBoss: false },
    { level: 3, name: 'Manager', payment: 150, isBoss: false },
    { level: 4, name: 'Boss', payment: 200, isBoss: true },
  ]
};

const App: React.FC = () => {
  const [jobData, setJobData] = useState<JobData>(INITIAL_JOB);
  // Initialize with the files generated from INITIAL_JOB to avoid empty array on first render
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>(() => generateAllFiles(INITIAL_JOB));
  const [customFiles, setCustomFiles] = useState<GeneratedFile[] | null>(null);
  const [isAIEditorOpen, setIsAIEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate when data changes
  useEffect(() => {
    setGeneratedFiles(generateAllFiles(jobData));
  }, [jobData]);

  const handleJobDataChange = (newData: JobData) => {
    setJobData(newData);
    setCustomFiles(null); // Reset custom edits if form is used
  };

  const displayFiles = customFiles || generatedFiles;

  const handleDownload = async () => {
    const zip = new JSZip();
    displayFiles.forEach(file => {
      zip.file(file.filename, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jobData.name}-job.zip`;
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
        setCustomFiles(newCustomFiles);
      }
    } catch (err) {
      console.error("Failed to import zip", err);
      alert("Failed to import ZIP file.");
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#11111b] text-[#cdd6f4] p-4 lg:p-8 flex flex-col font-sans">
      
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">QB-Core Job Studio</h1>
          </div>
          <p className="text-gray-400 text-sm max-w-lg">
            Rapidly scaffold jobs for your FiveM server. Generate Shared Lua, SQL, and boilerplate scripts instantly.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
             <input 
               type="file" 
               accept=".zip" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleImportZip}
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
             >
                <Upload className="w-4 h-4" />
                Import ZIP
             </button>
             <button 
               onClick={handleDownload}
               className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
             >
                <Download className="w-4 h-4" />
                Download
             </button>
             <button 
               onClick={() => setIsAIEditorOpen(true)}
               className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
             >
                <Sparkles className="w-4 h-4" />
                AI EDITOR
             </button>
             <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-gray-400 flex items-center gap-2">
                <Rocket className="w-3 h-3 text-qb-accent" />
                <span>v1.1.0</span>
             </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        
        {/* Left Panel: Form */}
        <section className="h-full flex flex-col overflow-y-auto pr-2">
            <div className="mb-4 flex items-center justify-between px-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-yellow-400" />
                    Configuration
                </h2>
                <span className="text-xs text-gray-500">Edit details below</span>
            </div>
            <JobForm 
                data={jobData} 
                onChange={handleJobDataChange} 
            />
        </section>

        {/* Right Panel: Preview */}
        <section className="h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between px-2">
                <h2 className="text-lg font-semibold text-white">Generated Assets</h2>
                <div className="flex items-center gap-2">
                    {customFiles && <span className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-400/10 rounded">Custom AI Edits Active</span>}
                    <span className="text-xs text-gray-500">Read-only preview</span>
                </div>
            </div>
            <CodePreview files={displayFiles} jobName={jobData.name} />
        </section>

      </main>

      {isAIEditorOpen && (
        <AIEditor 
          files={displayFiles} 
          onUpdateFiles={setCustomFiles} 
          onClose={() => setIsAIEditorOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;