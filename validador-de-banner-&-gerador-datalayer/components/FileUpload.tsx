
import React from 'react';
import { ACCEPTED_FORMATS } from '../constants';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl p-12 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:border-indigo-400 transition-colors group">
      <div className="mb-4 p-4 bg-indigo-50 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-800">Enviar Banner para Validação</h3>
      <p className="text-slate-500 text-center mb-6">Arraste e solte o arquivo ou clique para selecionar.<br/><span className="text-xs uppercase font-bold text-slate-400">PNG, JPG ou WEBP</span></p>
      
      <label className="cursor-pointer bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
        Selecionar Imagem
        <input 
          type="file" 
          className="hidden" 
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default FileUpload;
