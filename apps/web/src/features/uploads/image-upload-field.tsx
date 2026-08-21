'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCloudinaryUpload } from '@/features/uploads/use-cloudinary-upload';

interface ImageUploadFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  fallback: React.ReactNode;
}

export function ImageUploadField({ label, value, onChange, fallback }: ImageUploadFieldProps) {
  const { upload, isUploading } = useCloudinaryUpload();
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const url = await upload(file);
      onChange(url);
      toast.success('Imagem enviada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.');
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Avatar className="size-16">
          <AvatarImage src={value ?? undefined} alt="" />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}>
          {isUploading ? 'Enviando…' : value ? 'Trocar imagem' : 'Enviar imagem'}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileChange(event)} />
      </div>
    </div>
  );
}
