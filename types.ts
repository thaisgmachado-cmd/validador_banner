
export interface BannerDimensions {
  width: number;
  height: number;
  label: string;
  format: string;
}

export interface ValidationResult {
  isValid: boolean;
  width: number;
  height: number;
  format: string;
  promotionName?: string;
  textElement?: string;
  error?: string;
}

export interface DataLayerObject {
  event: string;
  typeElement: string;
  textElement: string;
  locationElement: string;
  pageName: string;
  promotionName: string;
  ambiente: string;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  VALIDATING = 'VALIDATING',
  INTERACTION = 'INTERACTION',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
