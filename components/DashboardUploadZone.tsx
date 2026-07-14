'use client';

import * as React from 'react';
import { uploadDocumentAction } from '@/app/actions/documentActions';
import { Upload, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DashboardUploadZone() {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Configurable size check: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setMessage({ type: 'error', text: 'File exceeds maximum upload size (10MB).' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadDocumentAction(formData);

    if (res?.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: `"${file.name}" indexed successfully. Chunks & embeddings saved!` });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setUploading(false);
  };

  return (
    <div className="border bg-card p-6 rounded-xl space-y-4">
      <h3 className="text-sm font-semibold">Upload Course Material</h3>
      
      <form onSubmit={handleUpload} className="space-y-4">
        {message && (
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
            message.type === 'error' 
              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          }`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${uploading ? 'pointer-events-none bg-muted/40' : 'hover:bg-muted/40'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md,.markdown,.pptx"
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-3 py-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <div>
                <p className="text-xs font-semibold">Extracting text & generating vectors...</p>
                <p className="text-[10px] text-muted-foreground mt-1">This will index and chunk page text for AI RAG search</p>
              </div>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <File className="h-8 w-8 text-indigo-500 animate-pulse" />
              <p className="text-xs font-semibold truncate max-w-xs">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB - Click to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-xs font-semibold">Click to upload document</p>
              <p className="text-[10px] text-muted-foreground">PDF, DOCX, PPTX, TXT, MD up to 10MB</p>
            </div>
          )}
        </div>

        {file && !uploading && (
          <Button type="submit" className="w-full flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Process & Index Document</span>
          </Button>
        )}
      </form>
    </div>
  );
}
