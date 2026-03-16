import JSZip from 'jszip';
import { GeneratedFile } from '../types';

export const downloadZip = async (jobName: string, files: GeneratedFile[]) => {
  const zip = new JSZip();

  // Root folder
  const root = zip.folder(`qb-${jobName}`);
  if (!root) return;

  files.forEach(file => {
    // Handle nested paths (e.g. client/main.lua)
    root.file(file.filename, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qb-${jobName}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};