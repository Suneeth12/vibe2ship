// Minimal type declarations for piexifjs (no official @types package).
declare module 'piexifjs' {
  interface IFDConstants {
    [key: string]: number;
  }

  const piexif: {
    GPSIFD: IFDConstants;
    ExifIFD: IFDConstants;
    ImageIFD: IFDConstants;
    /** Loads EXIF from a JPEG given as a binary string or data URL. */
    load(jpegData: string): {
      [ifd: string]: { [tag: number]: any };
      GPS: { [tag: number]: any };
      Exif: { [tag: number]: any };
      '0th': { [tag: number]: any };
    };
    dump(exifObj: any): string;
    insert(exifStr: string, jpegData: string): string;
    remove(jpegData: string): string;
  };

  export default piexif;
}
