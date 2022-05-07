export default ({
  acceptTypes = [],
  onSelect,
}: {
  acceptTypes?: string[];
  onSelect: (file: File) => void;
}) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = acceptTypes.join(',') || '*';
  input.onchange = () => {
    const [file] = Array.from(input.files || []);
    if (!file) {
      return;
    }
    setTimeout(() => input.remove(), 0);
    return onSelect(file);
  };
  input.click();
};
