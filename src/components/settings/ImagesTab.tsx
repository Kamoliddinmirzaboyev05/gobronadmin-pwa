import { useState, useRef } from 'react';
import { Upload, Trash2, ImageIcon } from 'lucide-react';
import type { Field, FieldImage } from '../../types';
import { fieldsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  field: Field;
  onUpdated: () => void;
}

export default function ImagesTab({ field, onUpdated }: Props) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const images: FieldImage[] = field.images || [];

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('image', file);
        await fieldsApi.uploadImage(field.id, fd);
      }
      showToast('Rasm(lar) yuklandi!', 'success');
      onUpdated();
    } catch {
      showToast('Yuklashda xatolik', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    try {
      await fieldsApi.deleteImage(field.id, imageId);
      showToast('Rasm o\'chirildi', 'success');
      onUpdated();
    } catch {
      showToast('O\'chirishda xatolik', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer drag-over-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size={32} className="text-orange-500" />
            <p className="text-sm text-gray-500">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Rasmlarni yuklash</p>
            <p className="text-xs text-gray-400">Bosing yoki sudrab tashlang (bir nechta rasm)</p>
          </div>
        )}
      </div>

      {/* Images grid */}
      {images.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ImageIcon size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Hali rasmlar yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
              <img
                src={img.image}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {deletingId === img.id ? <LoadingSpinner size={16} /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">Jami: {images.length} ta rasm</p>
    </div>
  );
}
