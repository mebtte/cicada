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
  input.onchange = () => {
    setTimeout(() => input.remove(), 0);
    const [file] = Array.from(input.files || []);
    return onSelect(file || null);
  };
  input.click();
}

export default selectFile;
