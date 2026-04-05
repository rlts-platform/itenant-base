import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PropertyPhotosTab({ property, onSaved }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState(
    (property.photo_urls || []).map(url => typeof url === "string" ? { url, timestamp: null } : url)
  );

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ url: file_url, timestamp: new Date().toISOString() });
    }
    const newPhotos = [...photos, ...uploaded];
    setPhotos(newPhotos);
    await base44.entities.Property.update(property.id, {
      photo_urls: newPhotos.map(p => JSON.stringify(p)),
    });
    setUploading(false);
    onSaved();
  };

  const removePhoto = async (idx) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    await base44.entities.Property.update(property.id, {
      photo_urls: newPhotos.map(p => JSON.stringify(p)),
    });
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium cursor-pointer hover:bg-primary/5 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload Photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground">
          No photos yet. Upload exterior and interior photos to build your property gallery.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, idx) => {
            const url = typeof photo === "string" ? photo : photo.url;
            const ts = typeof photo === "object" ? photo.timestamp : null;
            return (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-border bg-secondary aspect-square">
                <img src={url} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
                {ts && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1">
                    {new Date(ts).toLocaleDateString()}
                  </div>
                )}
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}