
/**
 * Formata strings de acordo com as regras estritas:
 * - Letras minúsculas
 * - Sem acentos
 * - Separados por underscore (_) em vez de espaços
 * - Caracteres especiais removidos (exceto _)
 */
export const formatToDataLayerString = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
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

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
  });
};
