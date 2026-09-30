import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { UploadCloud } from "lucide-react";

const ACCEPT = "image/jpeg,image/png,image/webp";

// Dropzone reusada por Inspección Manual (una imagen) y Dataset (varias) --
// mismo control de arrastrar/soltar o click, `multiple` decide si el picker
// nativo y el filtro aceptan más de un archivo.
export function ImageDropzone({ onFiles, multiple = false, hint }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(multiple ? files : [files[0]]);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`focus-ring flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors duration-150 ${
        dragOver ? "border-green-500 bg-green-50" : "border-line hover:border-line-strong bg-canvas"
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
        <UploadCloud size={18} strokeWidth={2} />
      </span>
      <p className="text-sm font-medium text-ink">Arrastra {multiple ? "imágenes" : "una imagen"} o haz click aquí</p>
      <p className="text-xs text-ink-faint">{hint ?? "Soporta JPG, PNG, WEBP"}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

ImageDropzone.propTypes = {
  onFiles: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  hint: PropTypes.string,
};
