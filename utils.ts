
/**
 * Formata strings de acordo com as regras estritas:
 * - Letras minúsculas
 * - Sem acentos
 * - Separados por underscore (_) em vez de espaços
 * - Hífens (-) convertidos em underscore (_)
 * - Caracteres especiais removidos (exceto _)
 */
export const formatToDataLayerString = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/-/g, '_') // Substituir hífens por underscore (Nova Regra)
    .replace(/\s+/g, '_') // Espaços para underscore
    .replace(/[^a-z0-9_]/g, '') // Remover caracteres especiais
    .replace(/_+/g, '_') // Evitar múltiplos underscores seguidos
    .replace(/^_+|_+$/g, ''); // Remover underscores no início/fim
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

export const convertSvgToPng = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Define um tamanho padrão caso o SVG não tenha dimensões intrínsecas claras
        // Mas o ideal é que ele use o tamanho real para validação correta.
        canvas.width = img.naturalWidth || 1920;
        canvas.height = img.naturalHeight || 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        // Fundo branco para garantir legibilidade no OCR (SVGs costumam ser transparentes)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        // Retorna apenas o base64 sem o prefixo data:image/png;base64,
        const pngData = canvas.toDataURL('image/png').split(',')[1];
        resolve(pngData);
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem SVG'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo SVG'));
    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    // Support for SVGs that might not have intrinsic size in all browsers
    img.onerror = () => {
        resolve({ width: 0, height: 0 });
    };
  });
};
