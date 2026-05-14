function selectFile({
  acceptTypes = [],
  onSelect,
}: {
  acceptTypes?: string[];
  onSelect: (file: File | null) => void;
}) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = acceptTypes.join(',') || '*';
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '-9999px';
  input.style.opacity = '0';

  const cleanup = () => {
    setTimeout(() => input.remove(), 0);
  };

  input.onchange = () => {
    const [file] = Array.from(input.files || []);
    cleanup();
    return onSelect(file || null);
  };
  input.oncancel = cleanup;
  document.body.append(input);
  input.click();
}

export default selectFile;
