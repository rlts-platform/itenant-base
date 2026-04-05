import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AttachmentLightbox({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = images[currentIndex];

  const handlePrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  const handleNext = () => setCurrentIndex((i) => (i + 1) % images.length);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = current.file_url;
    a.download = current.file_name || "image";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm">{currentIndex + 1} of {images.length}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleDownload} className="text-white hover:bg-white/10">
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <img src={current.file_url} alt={current.file_name} className="w-full max-h-[80vh] object-contain" />

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}