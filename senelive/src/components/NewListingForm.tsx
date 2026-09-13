'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createListing, type ListingState } from '@/lib/actions/listing';
import { createClient } from '@/lib/supabase/client';
import { Button, ErrorText, inputClass, labelClass } from '@/components/ui';
import { publicUrl } from '@/lib/media';

const CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Publication…' : 'Publier l’article'}
    </Button>
  );
}

export function NewListingForm({
  shopId,
  categories,
}: {
  shopId: string;
  categories: { id: number; name: string }[];
}) {
  const [state, formAction] = useActionState<ListingState, FormData>(createListing, {});
  const [paths, setPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 5 - paths.length);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(undefined);
    const supabase = createClient();

    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        // Premier segment = id de la boutique : c'est ce que la policy storage
        // compare au propriétaire.
        const path = `${shopId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('listing-images').upload(path, file);
        if (error) throw error;
        uploaded.push(path);
      }
      setPaths((current) => [...current, ...uploaded]);
    } catch {
      setUploadError("Une photo n'a pas pu être envoyée. Formats acceptés : JPG, PNG, WebP (5 Mo max).");
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  if (state.ok) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="text-sm text-brand-700">Article publié.</p>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            setPaths([]);
            formRef.current?.reset();
            window.location.reload();
          }}
        >
          Publier un autre article
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-5">
      <ErrorText message={state.error ?? uploadError} />

      <div>
        <label className={labelClass} htmlFor="title">
          Titre
        </label>
        <input id="title" name="title" required maxLength={140} className={`${inputClass} mt-1`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="price">
            Prix (FCFA)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            required
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="quantity">
            Quantité
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            defaultValue={1}
            required
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="condition">
            État
          </label>
          <select id="condition" name="condition" className={`${inputClass} mt-1`}>
            {CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="category_id">
          Catégorie
        </label>
        <select id="category_id" name="category_id" className={`${inputClass} mt-1`}>
          <option value="">Non classé</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea id="description" name="description" rows={3} className={`${inputClass} mt-1`} />
      </div>

      <div>
        <span className={labelClass}>Photos ({paths.length}/5)</span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {paths.map((path) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={path}
              src={publicUrl('listing-images', path)!}
              alt=""
              className="size-16 rounded-lg border border-line object-cover"
            />
          ))}
          {paths.length < 5 ? (
            <label className="flex size-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line text-2xl text-ink-400 hover:bg-canvas">
              {uploading ? '…' : '+'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFiles}
                disabled={uploading}
              />
            </label>
          ) : null}
        </div>
        {paths.map((path) => (
          <input key={path} type="hidden" name="image_paths" value={path} />
        ))}
      </div>

      <Submit />
    </form>
  );
}
