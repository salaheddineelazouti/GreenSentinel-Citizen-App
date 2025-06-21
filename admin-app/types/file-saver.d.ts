declare module 'file-saver' {
  export function saveAs(
    data: Blob | string | File,
    filename?: string,
    options?: { autoBom?: boolean }
  ): void;
}
