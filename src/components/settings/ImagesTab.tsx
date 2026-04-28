import { useState, useRef } from 'react';
import { Upload, Trash2, ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import type { Field, FieldImage } from '../../types';
import { fieldsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  field: Field;
  onUpdated: () => void;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImagesTab({ field, onUpdated }: Props) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const images: FieldImage[] = field.images || [];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Faqat JPG, PNG, WEBP formatdagi rasmlar qabul qilinadi';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Rasm hajmi 10MB dan oshmasligi kerak';
    }
    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: UploadingFile[] = [];
    
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        file,
        preview,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
      });
    });

    setUploadingFiles((prev) => [...prev, ...newFiles]);
    
    if (newFiles.some(f => f.status === 'pending')) {
      uploadFiles(newFiles.filter(f => f.status === 'pending'));
    }
  };

  const uploadFiles = async (filesToUpload: UploadingFile[]) => {
    setUploading(true);

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileItem = filesToUpload[i];
      
      // Update status to uploading
      setUploadingFiles((prev) => 
        prev.map((f) => f.file === fileItem.file ? { ...f, status: 'uploading' as const, progress: 0 } : f)
      );

      try {
        const fd = new FormData();
        fd.append('image', fileItem.file);
        
        // Simulate progress (real implementation would use XMLHttpRequest or axios for progress)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) => 
            prev.map((f) => 
              f.file === fileItem.file && f.progress < 90 
                ? { ...f, progress: f.progress + 10 } 
                : f
            )
          );
        }, 100);

        await fieldsApi.uploadImage(field.id, fd);
        
        clearInterval(progressInterval);
        
        // Update to success
        setUploadingFiles((prev) => 
          prev.map((f) => 
            f.file === fileItem.file 
              ? { ...f, status: 'success' as const, progress: 100 } 
              : f
          )
        );
        
      } catch (error) {
        // Update to error
        setUploadingFiles((prev) => 
          prev.map((f) => 
            f.file === fileItem.file 
              ? { ...f, status: 'error' as const, error: 'Yuklashda xatolik' } 
              : f
          )
        );
      }
    }

    setUploading(false);
    
    // Refresh field data
    onUpdated();
    
    // Show success message
    const successCount = filesToUpload.filter((_, i) => {
      const currentFile = uploadingFiles.find(f => f.file === filesToUpload[i].file);
      return currentFile?.status === 'success';
    }).length;
    
    if (successCount > 0) {
      showToast(`${successCount} ta rasm yuklandi!`, 'success');
    }
    
    // Clear successful uploads after 2 seconds
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter(f => f.status !== 'success'));
    }, 2000);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => {
      const file = prev[index];
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDelete = async (imageId: number) => {
    if (!window.confirm('Bu rasmni o\'chirishni xohlaysizmi?')) return;
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-emerald-400 bg-emerald-50/50 scale-[1.01]' 
            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner size={32} className="text-emerald-500" />
            <p className="text-sm text-gray-600 font-medium">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`transition-transform ${isDragging ? 'scale-110' : ''}`}>
              <Upload size={32} className={isDragging ? 'text-emerald-500' : 'text-gray-400'} />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {isDragging ? 'Rasmlarni qo\'yib yuboring' : 'Rasmlarni yuklash'}
            </p>
            <p className="text-xs text-gray-500">
              Bosing yoki sudrab tashlang (JPG, PNG, WEBP, max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Uploading files preview */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700">Yuklanmoqda:</p>
          <div className="space-y-2">
            {uploadingFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <img
                  src={item.preview}
                  alt=""
                  className="w-12 h-12 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.status === 'uploading' && (
                    <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{item.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
                  )}
                  {item.status === 'uploading' && (
                    <LoadingSpinner size={20} className="text-emerald-500" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle size={20} className="text-emerald-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle size={20} className="text-red-500" />
                  )}
                  {(item.status === 'pending' || item.status === 'error') && (
                    <button
                      onClick={() => removeUploadingFile(index)}
                      className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Hali rasmlar yo'q</p>
          <p className="text-xs mt-1">Yuqoridan rasm yuklang</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <img
                src={img.image}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                  <span className="text-xs text-white/90 font-medium">#{img.id}</span>
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deletingId === img.id}
                    className="p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg disabled:opacity-60"
                  >
                    {deletingId === img.id ? <LoadingSpinner size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">Jami: <span className="font-semibold text-gray-700">{images.length}</span> ta rasm</p>
        <p className="text-xs text-gray-500">Max: <span className="font-semibold text-gray-700">10MB</span>/rasm</p>
      </div>
    </div>
  );
}
