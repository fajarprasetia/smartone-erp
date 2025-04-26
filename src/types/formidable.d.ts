declare module 'formidable' {
  export interface FormidableOptions {
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFiles?: number;
    maxFileSize?: number;
    filter?: (part: { mimetype?: string }) => boolean;
  }
  
  export function formidable(options?: FormidableOptions): any;
} 