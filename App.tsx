
import React, { useState, useMemo } from 'react';
import { AppStep, ValidationResult, DataLayerObject } from './types';
import { VALID_DIMENSIONS, ACCEPTED_FORMATS, BRANDS } from './constants';
import { getImageDimensions, fileToBase64, formatToDataLayerString } from './utils';
import { extractBannerText } from './services/geminiService';
import FileUpload from './components/FileUpload';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [interactionData, setInteractionData] = useState({ pageName: '', locationElement: '' });
  const [finalDataLayers, setFinalDataLayers] = useState<DataLayerObject[] | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Analisando banner...');

  // Memoized image preview URL to avoid memory leaks
  const imagePreviewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return '';
  }, [file]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setStep(AppStep.VALIDATING);
    setLoadingMsg('Verificando dimensões e formato...');

    try {
      const dimensions = await getImageDimensions(selectedFile);
      const format = selectedFile.type.split('/')[1].toUpperCase();
      
      const isValidDimension = VALID_DIMENSIONS.some(
        d => d.width === dimensions.width && d.height === dimensions.height
      );

      const isValidFormat = ACCEPTED_FORMATS.includes(selectedFile.type);

      if (!isValidDimension || !isValidFormat) {
        setValidation({
          isValid: false,
          width: dimensions.width,
          height: dimensions.height,
          format,
          error: `Banner FORA DOS PADRÕES. O formato detectado é ${format} e/ou as dimensões ${dimensions.width}x${dimensions.height} não correspondem a nenhum padrão aceito.`
        });
        setStep(AppStep.ERROR);
        return;
      }

      setLoadingMsg('Extraindo textos da imagem (OCR)...');
      const base64 = await fileToBase64(selectedFile);
      const ocrResult = await extractBannerText(base64, selectedFile.type);

      setValidation({
        isValid: true,
        width: dimensions.width,
        height: dimensions.height,
        format,
        promotionName: ocrResult.promotionName,
        textElement: ocrResult.textElement
      });

      setStep(AppStep.INTERACTION);
    } catch (err) {
      console.error(err);
      setStep(AppStep.ERROR);
      setValidation({
        isValid: false,
        width: 0, height: 0, format: 'Unknown',
        error: "Ocorreu um erro ao processar a imagem. Verifique sua conexão e tente novamente."
      });
    }
  };

  const handleGenerateDataLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation) return;

    const formattedPageName = formatToDataLayerString(interactionData.pageName);
    const formattedLocation = formatToDataLayerString(interactionData.locationElement);
    const formattedText = formatToDataLayerString(validation.textElement || '');
    const formattedPromo = formatToDataLayerString(validation.promotionName || '');

    const dls: DataLayerObject[] = BRANDS.map(brand => ({
      event: "select_promotion",
      typeElement: "banner",
      textElement: formattedText,
      locationElement: formattedLocation,
      pageName: `${brand}:${formattedPageName}`,
      promotionName: formattedPromo,
      ambiente: "cms"
    }));

    setFinalDataLayers(dls);
    setStep(AppStep.RESULT);
  };

  const resetApp = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setStep(AppStep.UPLOAD);
    setFile(null);
    setValidation(null);
    setInteractionData({ pageName: '', locationElement: '' });
    setFinalDataLayers(null);
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    alert(msg);
  };

  const copyAllToClipboard = () => {
    if (finalDataLayers) {
      const allJson = finalDataLayers.map(dl => JSON.stringify(dl, null, 2)).join('\n\n');
      copyToClipboard(allJson, 'Todos os Data Layers foram copiados!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Banner Validator</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">GTM & Multi-Brand Data Layer Generator</p>
            </div>
          </div>
          {step !== AppStep.UPLOAD && (
            <button 
              onClick={resetApp}
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reiniciar
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 w-full">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ 
                width: step === AppStep.UPLOAD ? '25%' : 
                       step === AppStep.VALIDATING ? '50%' : 
                       step === AppStep.INTERACTION ? '75%' : '100%' 
              }}
            />
          </div>

          <div className="p-6 md:p-12">
            {step === AppStep.UPLOAD && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                <FileUpload onFileSelect={handleFileSelect} />
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xl">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <p className="font-bold mb-2 uppercase text-[10px] tracking-widest text-slate-400">Desktop Patterns</p>
                    <ul className="space-y-1">
                      <li>1440x260 (SVG)</li>
                      <li>1366x104 (SVG)</li>
                      <li>1920x347 (WEBP)</li>
                      <li>1920x146 (WEBP)</li>
                      <li>1920x400 (Custom)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <p className="font-bold mb-2 uppercase text-[10px] tracking-widest text-slate-400">Mobile Patterns</p>
                    <ul className="space-y-1">
                      <li>390x200 (SVG)</li>
                      <li>351x145 (SVG)</li>
                      <li>640x328 (WEBP)</li>
                      <li>640x264 (WEBP)</li>
                      <li>360x200 (Custom)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === AppStep.VALIDATING && (
              <div className="flex flex-col items-center py-12 text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Processando Banner</h3>
                <p className="text-slate-500">{loadingMsg}</p>
              </div>
            )}

            {step === AppStep.ERROR && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-full mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">ATENÇÃO: Banner FORA DOS PADRÕES</h2>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-800 text-sm mb-8">
                  {validation?.error}
                </div>
                <p className="text-slate-500 text-sm mb-8">O Data Layer NÃO será gerado devido a inconsistências técnicas nas dimensões ou formato.</p>
                <button 
                  onClick={resetApp}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Tentar Outro Banner
                </button>
              </div>
            )}

            {step === AppStep.INTERACTION && validation && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8 bg-green-50 p-4 rounded-2xl border border-green-100">
                  <div className="bg-green-500 text-white p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-800 font-medium text-sm">
                    Banner OK! O formato enviado é <span className="font-bold">{validation.format}</span> e está dentro dos padrões ({validation.width}x{validation.height}).
                  </p>
                </div>

                <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-indigo-900 text-xs font-bold uppercase mb-2 tracking-widest opacity-60">Extraído via OCR:</p>
                  <p className="text-indigo-900 text-sm"><span className="font-bold">Promotion:</span> {validation.promotionName || 'Não detectado'}</p>
                  <p className="text-indigo-900 text-sm"><span className="font-bold">CTA:</span> {validation.textElement || 'Não detectado'}</p>
                </div>

                <form onSubmit={handleGenerateDataLayer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Qual é o pagename para este banner?</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: home, pagina_de_produto, etc."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      value={interactionData.pageName}
                      onChange={(e) => setInteractionData(prev => ({ ...prev, pageName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Qual é o locationElement?</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: banner_principal, stripbanner, etc."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      value={interactionData.locationElement}
                      onChange={(e) => setInteractionData(prev => ({ ...prev, locationElement: e.target.value }))}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
                  >
                    Gerar Data Layers (6 Marcas)
                  </button>
                </form>
              </div>
            )}

            {step === AppStep.RESULT && finalDataLayers && validation && (
              <div className="animate-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Resultados da Validação</h3>
                    <p className="text-slate-500 text-sm">Data Layers gerados com sucesso para as 6 marcas.</p>
                  </div>
                  <button 
                    onClick={copyAllToClipboard}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copiar Todos
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
                    {finalDataLayers.map((dl, idx) => (
                      <div key={dl.pageName} className="relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            {idx + 1}. {dl.pageName.split(':')[0]}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(JSON.stringify(dl, null, 2), `Data Layer de ${dl.pageName.split(':')[0]} copiado!`)}
                            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 uppercase tracking-tighter"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copiar
                          </button>
                        </div>
                        <div className="relative">
                          <pre className="relative bg-slate-900 text-indigo-100 p-4 rounded-xl overflow-x-auto text-[12px] font-mono leading-relaxed shadow-md border border-slate-800">
                            {JSON.stringify(dl, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm sticky top-0">
                      <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Informações do Banner
                      </h4>
                      
                      {imagePreviewUrl && (
                        <div className="mt-4">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-widest text-center">Visualização</p>
                          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg group relative">
                            <img 
                              src={imagePreviewUrl} 
                              alt="Preview do Banner" 
                              className="w-full h-auto object-contain max-h-[300px] transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
                          </div>
                        </div>
                      )}

                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
                          <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Dimensões</p>
                          <p className="text-indigo-900 font-black">{validation.width}x{validation.height}</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Formato</p>
                          <p className="text-slate-900 font-black">{validation.format}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={resetApp}
                    className="w-full border-2 border-slate-200 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Validar Outro Banner
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-xs">
        <p>© {new Date().getFullYear()} Validador de Banner Estrito • GTM Integration v1.3</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
