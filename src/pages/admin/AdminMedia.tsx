import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import { Upload, Image as ImageIcon, Copy, Check, Cloud, AlertCircle, FileCheck } from 'lucide-react';

export const AdminMedia: React.FC = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB size limit.');
      return;
    }

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await adminApi.uploadImage({
          base64Data,
          filename: file.name
        });
        setUploadedUrl(res.url);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Media &amp; Cloud Storage</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Upload promotional posters, cinematic backdrops, and episode thumbnails.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="p-8 rounded-2xl bg-neutral-900/60 border-2 border-dashed border-neutral-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
          <Upload className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Upload Series Artwork</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Supports JPEG, PNG, and WebP files up to 5MB. Stored persistently for immediate usage across posters and backdrop slots.
          </p>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing Image...' : 'Choose File to Upload'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Uploaded Result Preview */}
      {uploadedUrl && (
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <FileCheck className="w-4 h-4" />
              <span>Image Uploaded &amp; Ready</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied URL!' : 'Copy Media URL'}</span>
            </button>
          </div>

          <div className="max-w-xs aspect-video rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
            <img src={uploadedUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
          </div>
          <p className="text-[11px] text-neutral-500 font-mono break-all line-clamp-1">
            {uploadedUrl.slice(0, 80)}...
          </p>
        </div>
      )}

      {/* Cloudflare R2 Production Architecture Guide */}
      <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2.5 text-neutral-200">
          <Cloud className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold">Cloudflare R2 Bucket Configuration (Production)</h3>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          While this development environment safely handles direct image uploads and high-definition external URLs, Cloudflare R2 provides zero-egress cost object storage for enterprise workloads.
        </p>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 text-xs font-mono text-neutral-300 space-y-2">
          <div className="text-neutral-500"># 1. Create your Cloudflare R2 Bucket</div>
          <div className="text-rose-400">npx wrangler r2 bucket create tv-catalog-media</div>
          <div className="text-neutral-500 mt-2"># 2. Check wrangler.jsonc contains the binding:</div>
          <pre className="text-neutral-300 text-[11px] overflow-x-auto">
{`"r2_buckets": [
  {
    "binding": "MEDIA_BUCKET",
    "bucket_name": "tv-catalog-media"
  }
]`}
          </pre>
          <div className="text-neutral-500 mt-2"># 3. Connect a custom domain in Cloudflare dashboard for public image delivery.</div>
        </div>
      </div>
    </div>
  );
};
