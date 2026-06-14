"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  CloudUpload,
  Eye,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CmsIcon } from "@/components/cms/cms-icon";
import { LandingPageRenderer } from "@/components/cms/landing-page-renderer";
import { defaultBorrowerAgreement } from "@/cms/defaults";
import { supabaseClient } from "@/lib/supabase-client";
import {
  PublicLandingContentSchema,
  RoleShellContentSchema,
  richTextFromPlainText,
  richTextToPlainText,
  type CmsDocumentKeyValue,
  type LandingSection,
  type PublicLandingContent,
  type RoleShellContent,
} from "@/schemas/cms.schema";
import type { LandingMetrics } from "@/services/landing-metrics.service";
import { useToast } from "@/components/ui/toast";

type CmsDocumentResponse = {
  key: CmsDocumentKeyValue;
  draftVersion: number;
  publishedVersion: number;
  draftContent: PublicLandingContent | RoleShellContent;
  publishedContent: PublicLandingContent | RoleShellContent;
  publishedAt: string | null;
  updatedAt: string;
};
type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "conflict" | "error";
type WorkspaceTab = "PUBLIC_LANDING" | "BORROWER_SHELL" | "DONOR_SHELL" | "HISTORY";
type CmsAsset = {
  id: string;
  publicUrl: string;
  fileName: string;
  defaultAlt: string | null;
  width: number | null;
  height: number | null;
};
type Revision = {
  id: string;
  version: number;
  changeNote: string | null;
  createdBy: string | null;
  createdAt: string;
};

const zeroMetrics: LandingMetrics = {
  totalDonations: 0,
  totalDisbursed: 0,
  studentsHelped: 0,
  activeLoans: 0,
};

const tabLabels: Record<WorkspaceTab, string> = {
  PUBLIC_LANDING: "Landing Publik",
  BORROWER_SHELL: "Peminjam",
  DONOR_SHELL: "Donor",
  HISTORY: "Riwayat",
};

const iconOptions = [
  { value: "heart", label: "Hati" },
  { value: "graduation-cap", label: "Pendidikan" },
  { value: "hand-coins", label: "Pendanaan" },
  { value: "dollar", label: "Dana" },
  { value: "users", label: "Pengguna" },
  { value: "percent", label: "Persentase" },
  { value: "shield", label: "Keamanan" },
  { value: "file-text", label: "Dokumen" },
  { value: "lock", label: "Privasi" },
  { value: "badge-check", label: "Terverifikasi" },
  { value: "check", label: "Centang" },
] as const;

type IconValue = (typeof iconOptions)[number]["value"];

const sectionLabels: Record<LandingSection["type"], string> = {
  hero: "Hero",
  howItWorks: "Cara Kerja",
  impactStats: "Dampak",
  programs: "Program",
  trustTransparency: "Kepercayaan",
  faq: "FAQ",
  callToAction: "Call to Action",
};

function Field({
  label,
  hint,
  count,
  children,
}: {
  label: string;
  hint?: string;
  count?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
        <span>{label}</span>
        {count && <span className="text-xs font-medium text-gray-400">{count}</span>}
      </span>
      {hint && <span className="mt-1 block text-xs leading-5 text-gray-500">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const inputClass = "min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100";
const textareaClass = `${inputClass} min-h-24 resize-y py-3 leading-6`;

function IconPicker({
  value,
  onChange,
  allowNone = false,
}: {
  value?: string;
  onChange: (value: IconValue | undefined) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {allowNone && (
        <button
          type="button"
          aria-label="Tanpa ikon"
          aria-pressed={!value}
          onClick={() => onChange(undefined)}
          className={`flex min-h-16 flex-col items-center justify-center rounded-lg border px-2 text-[10px] font-bold transition ${
            !value ? "border-[#07B0C8] bg-cyan-50 text-[#078DA1]" : "border-gray-200 bg-white text-gray-500 hover:border-cyan-200"
          }`}
        >
          <X className="mb-1 h-4 w-4" />
          Tanpa ikon
        </button>
      )}
      {iconOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={`Gunakan ikon ${option.label}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex min-h-16 flex-col items-center justify-center rounded-lg border px-2 text-[10px] font-bold transition ${
            value === option.value ? "border-[#07B0C8] bg-cyan-50 text-[#078DA1]" : "border-gray-200 bg-white text-gray-500 hover:border-cyan-200 hover:text-slate-700"
          }`}
        >
          <CmsIcon name={option.value} className="mb-1 h-5 w-5" />
          <span className="line-clamp-1">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function CollectionCard({
  title,
  index,
  total,
  onMove,
  onDelete,
  children,
}: {
  title: string;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-[#FAFBFC] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-extrabold text-slate-800">{title}</h4>
        <div className="flex items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Pindahkan ke atas" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Pindahkan ke bawah" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          {onDelete && <button type="button" onClick={onDelete} aria-label="Hapus item" className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </article>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function moveLandingSection(items: LandingSection[], index: number, direction: -1 | 1) {
  const target = Math.max(1, Math.min(items.length - 2, index + direction));
  if (target === index) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function newId() {
  return crypto.randomUUID();
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung pemrosesan gambar");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("Gagal mengompresi gambar");
  if (blob.size > 1_500_000) throw new Error("Gambar masih lebih besar dari 1.5 MB setelah kompresi");
  return {
    file: new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }),
    width,
    height,
  };
}

function LandingSectionEditor({
  section,
  update,
  assets,
  isUploading,
  uploadImage,
}: {
  section: LandingSection;
  update: (section: LandingSection) => void;
  assets: CmsAsset[];
  isUploading: boolean;
  uploadImage: (file: File) => Promise<CmsAsset | null>;
}) {
  if (section.type === "hero") {
    return (
      <div className="space-y-5">
        <Field label="Judul hero" count={`${section.heading.length}/140`}>
          <input className={inputClass} value={section.heading} onChange={(event) => update({ ...section, heading: event.target.value })} />
        </Field>
        <Field label="Deskripsi" hint="Teks ditampilkan dengan format yang konsisten pada landing.">
          <textarea className={textareaClass} value={richTextToPlainText(section.description)} onChange={(event) => update({ ...section, description: richTextFromPlainText(event.target.value) })} />
        </Field>
        <div className="rounded-xl border border-gray-200 bg-[#FAFBFC] p-4">
          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <Image src={section.image.url} alt="" fill sizes="180px" className="object-cover" style={{ objectPosition: `${section.image.focalX}% ${section.image.focalY}%` }} />
            </div>
            <div className="space-y-3">
              <Field label="Gambar hero" hint="JPEG, PNG, WebP, atau AVIF. Gambar otomatis dikompresi maksimal 1.5 MB.">
                <select className={inputClass} value={section.image.url} onChange={(event) => update({ ...section, image: { ...section.image, url: event.target.value } })}>
                  <option value={section.image.url}>{section.image.url.startsWith("/") ? "Gambar bawaan" : "Gambar aktif"}</option>
                  {assets.filter((asset) => asset.publicUrl !== section.image.url).map((asset) => <option key={asset.id} value={asset.publicUrl}>{asset.fileName}</option>)}
                </select>
              </Field>
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 text-sm font-bold text-[#078DA1] transition hover:bg-cyan-100">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? "Mengunggah..." : "Upload gambar baru"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={isUploading}
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      const asset = await uploadImage(file);
                      if (asset) {
                        update({
                          ...section,
                          image: {
                            ...section.image,
                            url: asset.publicUrl,
                            alt: asset.defaultAlt || section.image.alt,
                          },
                        });
                      }
                    }
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alt text">
            <input className={inputClass} value={section.image.alt} onChange={(event) => update({ ...section, image: { ...section.image, alt: event.target.value } })} />
          </Field>
          <Field label="Overlay gambar">
            <select className={inputClass} value={section.overlay} onChange={(event) => update({ ...section, overlay: event.target.value as typeof section.overlay })}>
              <option value="cyan">Cyan</option>
              <option value="dark">Gelap</option>
              <option value="soft">Lembut</option>
            </select>
          </Field>
          <Field label="Fokus horizontal" count={`${section.image.focalX}%`}>
            <input type="range" min="0" max="100" className="w-full accent-[#07B0C8]" value={section.image.focalX} onChange={(event) => update({ ...section, image: { ...section.image, focalX: Number(event.target.value) } })} />
          </Field>
          <Field label="Fokus vertikal" count={`${section.image.focalY}%`}>
            <input type="range" min="0" max="100" className="w-full accent-[#07B0C8]" value={section.image.focalY} onChange={(event) => update({ ...section, image: { ...section.image, focalY: Number(event.target.value) } })} />
          </Field>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-extrabold text-slate-800">Action cards</h3>{section.cards.length < 3 && <button type="button" onClick={() => update({ ...section, cards: [...section.cards, { id: newId(), title: "Card baru", description: "Deskripsi card", icon: "heart", theme: "cyan", button: { id: newId(), label: "Pelajari", href: "/", variant: "primary" } }] })} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-50 px-3 text-sm font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah</button>}</div>
          {section.cards.map((card, index) => (
            <CollectionCard key={card.id} title={`Card ${index + 1}`} index={index} total={section.cards.length} onMove={(direction) => update({ ...section, cards: moveItem(section.cards, index, direction) })} onDelete={section.cards.length > 1 ? () => update({ ...section, cards: section.cards.filter((item) => item.id !== card.id) }) : undefined}>
              <Field label="Judul"><input className={inputClass} value={card.title} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, title: event.target.value } : item) })} /></Field>
              <Field label="Deskripsi"><textarea className={textareaClass} value={card.description} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, description: event.target.value } : item) })} /></Field>
              <Field label="Ikon card" hint="Ikon langsung digunakan pada card Hero.">
                <IconPicker value={card.icon} onChange={(icon) => icon && update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, icon } : item) })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label tombol"><input className={inputClass} value={card.button.label} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, button: { ...item.button, label: event.target.value } } : item) })} /></Field>
                <Field label="Tujuan tombol"><input className={inputClass} value={card.button.href} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, button: { ...item.button, href: event.target.value } } : item) })} /></Field>
              </div>
              <Field label="Ikon tombol" hint="Opsional. Pilih tanpa ikon untuk tombol teks saja.">
                <IconPicker allowNone value={card.button.icon} onChange={(icon) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, button: { ...item.button, icon } } : item) })} />
              </Field>
            </CollectionCard>
          ))}
        </div>
      </div>
    );
  }

  const header = "title" in section ? (
    <>
      <Field label="Judul section"><input className={inputClass} value={section.title} onChange={(event) => update({ ...section, title: event.target.value } as LandingSection)} /></Field>
      {"description" in section && typeof section.description === "string" && <Field label="Deskripsi section"><textarea className={textareaClass} value={section.description} onChange={(event) => update({ ...section, description: event.target.value } as LandingSection)} /></Field>}
    </>
  ) : null;

  if (section.type === "howItWorks") return (
    <div className="space-y-5">{header}
      {section.steps.map((step, index) => <CollectionCard key={step.id} title={`Langkah ${index + 1}`} index={index} total={section.steps.length} onMove={(direction) => update({ ...section, steps: moveItem(section.steps, index, direction) })} onDelete={section.steps.length > 2 ? () => update({ ...section, steps: section.steps.filter((item) => item.id !== step.id) }) : undefined}>
        <Field label="Judul"><input className={inputClass} value={step.title} onChange={(event) => update({ ...section, steps: section.steps.map((item) => item.id === step.id ? { ...item, title: event.target.value } : item) })} /></Field>
        <Field label="Deskripsi"><textarea className={textareaClass} value={step.description} onChange={(event) => update({ ...section, steps: section.steps.map((item) => item.id === step.id ? { ...item, description: event.target.value } : item) })} /></Field>
      </CollectionCard>)}
      {section.steps.length < 6 && <button type="button" onClick={() => update({ ...section, steps: [...section.steps, { id: newId(), title: "Langkah baru", description: "Jelaskan langkah ini.", color: "cyan" }] })} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-300 font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah langkah</button>}
    </div>
  );

  if (section.type === "impactStats") return (
    <div className="space-y-5">{header}
      {section.cards.map((card, index) => <CollectionCard key={card.id} title={`Statistik ${index + 1}`} index={index} total={section.cards.length} onMove={(direction) => update({ ...section, cards: moveItem(section.cards, index, direction) })} onDelete={section.cards.length > 1 ? () => update({ ...section, cards: section.cards.filter((item) => item.id !== card.id) }) : undefined}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sumber nilai"><select className={inputClass} value={card.metric} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, metric: event.target.value as typeof card.metric } : item) })}><option value="totalDonations">Total donasi</option><option value="totalDisbursed">Total penyaluran</option><option value="studentsHelped">Mahasiswa terbantu</option><option value="activeLoans">Pinjaman aktif</option><option value="manual">Manual</option></select></Field>
          {card.metric === "manual" && <Field label="Nilai manual"><input className={inputClass} value={card.manualValue || ""} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, manualValue: event.target.value } : item) })} /></Field>}
        </div>
        <Field label="Label"><input className={inputClass} value={card.label} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, label: event.target.value } : item) })} /></Field>
        <Field label="Deskripsi"><textarea className={textareaClass} value={card.description} onChange={(event) => update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, description: event.target.value } : item) })} /></Field>
        <Field label="Ikon statistik">
          <IconPicker value={card.icon} onChange={(icon) => icon && update({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, icon } : item) })} />
        </Field>
      </CollectionCard>)}
      {section.cards.length < 4 && <button type="button" onClick={() => update({ ...section, cards: [...section.cards, { id: newId(), metric: "manual", manualValue: "0", label: "Statistik baru", description: "Deskripsi statistik.", icon: "users", prefix: "", suffix: "", format: "plain" }] })} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-300 font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah statistik</button>}
    </div>
  );

  if (section.type === "programs") return (
    <div className="space-y-5">{header}
      {section.programs.map((program, index) => <CollectionCard key={program.id} title={`Program ${index + 1}`} index={index} total={section.programs.length} onMove={(direction) => update({ ...section, programs: moveItem(section.programs, index, direction) })} onDelete={section.programs.length > 1 ? () => update({ ...section, programs: section.programs.filter((item) => item.id !== program.id) }) : undefined}>
        <Field label="Judul card"><input className={inputClass} value={program.title} onChange={(event) => update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, title: event.target.value } : item) })} /></Field>
        <Field label="Ringkasan card"><textarea className={textareaClass} value={program.summary} onChange={(event) => update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, summary: event.target.value } : item) })} /></Field>
        <Field label="Ikon program">
          <IconPicker value={program.icon} onChange={(icon) => icon && update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, icon } : item) })} />
        </Field>
        <Field label="Isi popup"><textarea className={`${textareaClass} min-h-36`} value={richTextToPlainText(program.detail)} onChange={(event) => update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, detail: richTextFromPlainText(event.target.value) } : item) })} /></Field>
        <Field label="Persyaratan" hint="Satu persyaratan per baris."><textarea className={textareaClass} value={program.terms.join("\n")} onChange={(event) => update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, terms: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 12) } : item) })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Label CTA"><input className={inputClass} value={program.buttonLabel} onChange={(event) => update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, buttonLabel: event.target.value } : item) })} /></Field><Field label="Link CTA"><input className={inputClass} value={program.href} onChange={(event) => update({ ...section, programs: section.programs.map((item) => item.id === program.id ? { ...item, href: event.target.value } : item) })} /></Field></div>
      </CollectionCard>)}
      {section.programs.length < 6 && <button type="button" onClick={() => update({ ...section, programs: [...section.programs, { id: newId(), title: "Program baru", summary: "Ringkasan program.", icon: "heart", detail: richTextFromPlainText("Detail program."), terms: [], buttonLabel: "Pelajari", href: "/" }] })} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-300 font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah program</button>}
    </div>
  );

  if (section.type === "faq") return (
    <div className="space-y-5">{header}
      {section.items.map((item, index) => <CollectionCard key={item.id} title={`FAQ ${index + 1}`} index={index} total={section.items.length} onMove={(direction) => update({ ...section, items: moveItem(section.items, index, direction) })} onDelete={section.items.length > 1 ? () => update({ ...section, items: section.items.filter((entry) => entry.id !== item.id) }) : undefined}>
        <Field label="Pertanyaan"><input className={inputClass} value={item.question} onChange={(event) => update({ ...section, items: section.items.map((entry) => entry.id === item.id ? { ...entry, question: event.target.value } : entry) })} /></Field>
        <Field label="Jawaban"><textarea className={textareaClass} value={richTextToPlainText(item.answer)} onChange={(event) => update({ ...section, items: section.items.map((entry) => entry.id === item.id ? { ...entry, answer: richTextFromPlainText(event.target.value) } : entry) })} /></Field>
      </CollectionCard>)}
      {section.items.length < 20 && <button type="button" onClick={() => update({ ...section, items: [...section.items, { id: newId(), question: "Pertanyaan baru", answer: richTextFromPlainText("Jawaban baru") }] })} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-300 font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah FAQ</button>}
    </div>
  );

  if (section.type === "trustTransparency") return (
    <div className="space-y-5">{header}
      {section.features.map((feature, index) => <CollectionCard key={feature.id} title={`Feature ${index + 1}`} index={index} total={section.features.length} onMove={(direction) => update({ ...section, features: moveItem(section.features, index, direction) })} onDelete={section.features.length > 1 ? () => update({ ...section, features: section.features.filter((item) => item.id !== feature.id) }) : undefined}>
        <Field label="Judul"><input className={inputClass} value={feature.title} onChange={(event) => update({ ...section, features: section.features.map((item) => item.id === feature.id ? { ...item, title: event.target.value } : item) })} /></Field>
        <Field label="Deskripsi"><textarea className={textareaClass} value={feature.description} onChange={(event) => update({ ...section, features: section.features.map((item) => item.id === feature.id ? { ...item, description: event.target.value } : item) })} /></Field>
        <Field label="Ikon feature">
          <IconPicker value={feature.icon} onChange={(icon) => icon && update({ ...section, features: section.features.map((item) => item.id === feature.id ? { ...item, icon } : item) })} />
        </Field>
      </CollectionCard>)}
      {section.features.length < 9 && <button type="button" onClick={() => update({ ...section, features: [...section.features, { id: newId(), title: "Feature baru", description: "Deskripsi feature.", icon: "shield" }] })} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-300 font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah feature</button>}
      <Field label="Certification badges" hint="Pisahkan label dengan baris baru.">
        <textarea className={textareaClass} value={section.certifications.map((item) => item.label).join("\n")} onChange={(event) => update({ ...section, certifications: event.target.value.split("\n").map((label) => label.trim()).filter(Boolean).slice(0, 8).map((label, index) => ({ id: section.certifications[index]?.id || newId(), label })) })} />
      </Field>
    </div>
  );

  return (
    <div className="space-y-5">
      <Field label="Judul CTA"><input className={inputClass} value={section.title} onChange={(event) => update({ ...section, title: event.target.value })} /></Field>
      <Field label="Deskripsi"><textarea className={textareaClass} value={richTextToPlainText(section.description)} onChange={(event) => update({ ...section, description: richTextFromPlainText(event.target.value) })} /></Field>
      {section.buttons.map((button, index) => <CollectionCard key={button.id} title={`Tombol ${index + 1}`} index={index} total={section.buttons.length} onMove={(direction) => update({ ...section, buttons: moveItem(section.buttons, index, direction) })}>
        <Field label="Label"><input className={inputClass} value={button.label} onChange={(event) => update({ ...section, buttons: section.buttons.map((item) => item.id === button.id ? { ...item, label: event.target.value } : item) })} /></Field>
        <Field label="Link"><input className={inputClass} value={button.href} onChange={(event) => update({ ...section, buttons: section.buttons.map((item) => item.id === button.id ? { ...item, href: event.target.value } : item) })} /></Field>
        <Field label="Ikon tombol" hint="Opsional.">
          <IconPicker allowNone value={button.icon} onChange={(icon) => update({ ...section, buttons: section.buttons.map((item) => item.id === button.id ? { ...item, icon } : item) })} />
        </Field>
      </CollectionCard>)}
    </div>
  );
}

function RoleShellEditor({ value, onChange }: { value: RoleShellContent; onChange: (value: RoleShellContent) => void }) {
  const setLabel = (key: keyof RoleShellContent["menuLabels"], label: string) => onChange({ ...value, menuLabels: { ...value.menuLabels, [key]: label } });
  const borrowerAgreement = value.borrowerAgreement || defaultBorrowerAgreement;
  const setBorrowerAgreement = (
    key: keyof NonNullable<RoleShellContent["borrowerAgreement"]>,
    fieldValue: string | string[]
  ) => {
    if (!borrowerAgreement) return;
    onChange({
      ...value,
      borrowerAgreement: {
        ...borrowerAgreement,
        [key]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">Branding dan menu</h2>
        <p className="mt-1 text-sm text-gray-500">Route inti tetap dikunci agar user tidak kehilangan akses fitur.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="URL logo"><input className={inputClass} value={value.logoUrl} onChange={(event) => onChange({ ...value, logoUrl: event.target.value })} /></Field>
          <Field label="Alt logo"><input className={inputClass} value={value.logoAlt} onChange={(event) => onChange({ ...value, logoAlt: event.target.value })} /></Field>
          <Field label="Label Dashboard"><input className={inputClass} value={value.menuLabels.dashboard} onChange={(event) => setLabel("dashboard", event.target.value)} /></Field>
          {"apply" in value.menuLabels && <Field label="Label Pengajuan"><input className={inputClass} value={value.menuLabels.apply || ""} onChange={(event) => setLabel("apply", event.target.value)} /></Field>}
          {"installment" in value.menuLabels && <Field label="Label Cicilan"><input className={inputClass} value={value.menuLabels.installment || ""} onChange={(event) => setLabel("installment", event.target.value)} /></Field>}
          {"donate" in value.menuLabels && <Field label="Label Donasi"><input className={inputClass} value={value.menuLabels.donate || ""} onChange={(event) => setLabel("donate", event.target.value)} /></Field>}
          <Field label="Label Profil"><input className={inputClass} value={value.menuLabels.profile} onChange={(event) => setLabel("profile", event.target.value)} /></Field>
          <Field label="Label Logout"><input className={inputClass} value={value.menuLabels.logout} onChange={(event) => setLabel("logout", event.target.value)} /></Field>
        </div>
      </section>
      {"apply" in value.menuLabels && borrowerAgreement && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">Syarat pengajuan pinjaman</h2>
          <p className="mt-1 text-sm text-gray-500">Konten ini tampil pada tahap terakhir sebelum peminjam mengirim pengajuan.</p>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Judul section"><input className={inputClass} value={borrowerAgreement.sectionTitle} onChange={(event) => setBorrowerAgreement("sectionTitle", event.target.value)} /></Field>
              <Field label="Judul kesepakatan"><input className={inputClass} value={borrowerAgreement.agreementTitle} onChange={(event) => setBorrowerAgreement("agreementTitle", event.target.value)} /></Field>
            </div>
            <Field label="Deskripsi section"><input className={inputClass} value={borrowerAgreement.sectionDescription} onChange={(event) => setBorrowerAgreement("sectionDescription", event.target.value)} /></Field>
            <Field label="Pembuka"><textarea className={textareaClass} value={borrowerAgreement.introduction} onChange={(event) => setBorrowerAgreement("introduction", event.target.value)} /></Field>
            <Field label="Penjelasan program"><textarea className={textareaClass} value={borrowerAgreement.explanation} onChange={(event) => setBorrowerAgreement("explanation", event.target.value)} /></Field>
            <Field label="Daftar ketentuan" hint="Tulis satu ketentuan per baris. Maksimal 15 item.">
              <textarea
                className={`${textareaClass} min-h-40`}
                value={borrowerAgreement.terms.join("\n")}
                onChange={(event) => setBorrowerAgreement("terms", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 15))}
              />
            </Field>
            <Field label="Ketentuan kesulitan pembayaran"><textarea className={textareaClass} value={borrowerAgreement.hardshipText} onChange={(event) => setBorrowerAgreement("hardshipText", event.target.value)} /></Field>
            <Field label="Penutup"><textarea className={textareaClass} value={borrowerAgreement.closingText} onChange={(event) => setBorrowerAgreement("closingText", event.target.value)} /></Field>
            <Field label="Teks persetujuan checkbox"><textarea className={textareaClass} value={borrowerAgreement.checkboxLabel} onChange={(event) => setBorrowerAgreement("checkboxLabel", event.target.value)} /></Field>
          </div>
        </section>
      )}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-slate-900">Footer ringkas</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Teks bantuan"><input className={inputClass} value={value.helpText} onChange={(event) => onChange({ ...value, helpText: event.target.value })} /></Field>
          <Field label="Copyright"><input className={inputClass} value={value.footer.copyright} onChange={(event) => onChange({ ...value, footer: { ...value.footer, copyright: event.target.value } })} /></Field>
          <Field label="Label bantuan"><input className={inputClass} value={value.footer.helpLabel} onChange={(event) => onChange({ ...value, footer: { ...value.footer, helpLabel: event.target.value } })} /></Field>
          <Field label="Link bantuan"><input className={inputClass} value={value.footer.helpHref} onChange={(event) => onChange({ ...value, footer: { ...value.footer, helpHref: event.target.value } })} /></Field>
          <Field label="Label kontak"><input className={inputClass} value={value.footer.contactLabel} onChange={(event) => onChange({ ...value, footer: { ...value.footer, contactLabel: event.target.value } })} /></Field>
          <Field label="Link kontak"><input className={inputClass} value={value.footer.contactHref} onChange={(event) => onChange({ ...value, footer: { ...value.footer, contactHref: event.target.value } })} /></Field>
        </div>
      </section>
    </div>
  );
}

function PublicSettingsEditor({
  panel,
  value,
  onChange,
}: {
  panel: "seo" | "navbar" | "footer";
  value: PublicLandingContent;
  onChange: (value: PublicLandingContent) => void;
}) {
  if (panel === "seo") {
    return (
      <div className="space-y-5">
        <Field label="SEO title" count={`${value.seo.title.length}/70`}>
          <input className={inputClass} maxLength={70} value={value.seo.title} onChange={(event) => onChange({ ...value, seo: { ...value.seo, title: event.target.value } })} />
        </Field>
        <Field label="Meta description" count={`${value.seo.description.length}/170`}>
          <textarea className={textareaClass} maxLength={170} value={value.seo.description} onChange={(event) => onChange({ ...value, seo: { ...value.seo, description: event.target.value } })} />
        </Field>
        <Field label="Open Graph image URL">
          <input className={inputClass} value={value.seo.ogImageUrl} onChange={(event) => onChange({ ...value, seo: { ...value.seo, ogImageUrl: event.target.value } })} />
        </Field>
      </div>
    );
  }

  if (panel === "navbar") {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL logo"><input className={inputClass} value={value.navbar.logoUrl} onChange={(event) => onChange({ ...value, navbar: { ...value.navbar, logoUrl: event.target.value } })} /></Field>
          <Field label="Alt logo"><input className={inputClass} value={value.navbar.logoAlt} onChange={(event) => onChange({ ...value, navbar: { ...value.navbar, logoAlt: event.target.value } })} /></Field>
          <Field label="Label masuk"><input className={inputClass} value={value.navbar.loginLabel} onChange={(event) => onChange({ ...value, navbar: { ...value.navbar, loginLabel: event.target.value } })} /></Field>
          <Field label="Label daftar"><input className={inputClass} value={value.navbar.registerLabel} onChange={(event) => onChange({ ...value, navbar: { ...value.navbar, registerLabel: event.target.value } })} /></Field>
        </div>
        <div>
          <h3 className="mb-3 font-extrabold text-slate-800">Menu landing</h3>
          <div className="space-y-3">
            {value.navbar.items.map((item, index) => (
              <CollectionCard
                key={item.id}
                title={`Menu ${index + 1}`}
                index={index}
                total={value.navbar.items.length}
                onMove={(direction) => onChange({ ...value, navbar: { ...value.navbar, items: moveItem(value.navbar.items, index, direction) } })}
                onDelete={value.navbar.items.length > 1 ? () => onChange({ ...value, navbar: { ...value.navbar, items: value.navbar.items.filter((entry) => entry.id !== item.id) } }) : undefined}
              >
                <Field label="Label"><input className={inputClass} value={item.label} onChange={(event) => onChange({ ...value, navbar: { ...value.navbar, items: value.navbar.items.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry) } })} /></Field>
                <Field label="Target section"><select className={inputClass} value={item.sectionId} onChange={(event) => onChange({ ...value, navbar: { ...value.navbar, items: value.navbar.items.map((entry) => entry.id === item.id ? { ...entry, sectionId: event.target.value } : entry) } })}>{value.sections.filter((section) => section.enabled).map((section) => <option key={section.id} value={section.id}>{sectionLabels[section.type]}</option>)}</select></Field>
              </CollectionCard>
            ))}
          </div>
          {value.navbar.items.length < 6 && <button type="button" onClick={() => onChange({ ...value, navbar: { ...value.navbar, items: [...value.navbar.items, { id: newId(), label: "Menu baru", sectionId: value.sections.find((section) => section.enabled)?.id || "home" }] } })} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-300 font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah menu</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URL logo"><input className={inputClass} value={value.footer.logoUrl} onChange={(event) => onChange({ ...value, footer: { ...value.footer, logoUrl: event.target.value } })} /></Field>
        <Field label="Alt logo"><input className={inputClass} value={value.footer.logoAlt} onChange={(event) => onChange({ ...value, footer: { ...value.footer, logoAlt: event.target.value } })} /></Field>
      </div>
      <Field label="Deskripsi organisasi"><textarea className={textareaClass} value={value.footer.description} onChange={(event) => onChange({ ...value, footer: { ...value.footer, description: event.target.value } })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email"><input type="email" className={inputClass} value={value.footer.contact.email} onChange={(event) => onChange({ ...value, footer: { ...value.footer, contact: { ...value.footer.contact, email: event.target.value } } })} /></Field>
        <Field label="Telepon"><input className={inputClass} value={value.footer.contact.phone} onChange={(event) => onChange({ ...value, footer: { ...value.footer, contact: { ...value.footer.contact, phone: event.target.value } } })} /></Field>
      </div>
      <Field label="Alamat"><input className={inputClass} value={value.footer.contact.address} onChange={(event) => onChange({ ...value, footer: { ...value.footer, contact: { ...value.footer.contact, address: event.target.value } } })} /></Field>
      <Field label="Copyright"><input className={inputClass} value={value.footer.copyright} onChange={(event) => onChange({ ...value, footer: { ...value.footer, copyright: event.target.value } })} /></Field>
      <div>
        <h3 className="mb-3 font-extrabold text-slate-800">Kelompok link</h3>
        <div className="space-y-3">
          {value.footer.groups.map((group, groupIndex) => (
            <CollectionCard key={group.id} title={group.title || `Kelompok ${groupIndex + 1}`} index={groupIndex} total={value.footer.groups.length} onMove={(direction) => onChange({ ...value, footer: { ...value.footer, groups: moveItem(value.footer.groups, groupIndex, direction) } })} onDelete={value.footer.groups.length > 1 ? () => onChange({ ...value, footer: { ...value.footer, groups: value.footer.groups.filter((item) => item.id !== group.id) } }) : undefined}>
              <Field label="Judul kelompok"><input className={inputClass} value={group.title} onChange={(event) => onChange({ ...value, footer: { ...value.footer, groups: value.footer.groups.map((item) => item.id === group.id ? { ...item, title: event.target.value } : item) } })} /></Field>
              {group.links.map((link) => <div key={link.id} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input aria-label="Label link" className={inputClass} value={link.label} onChange={(event) => onChange({ ...value, footer: { ...value.footer, groups: value.footer.groups.map((item) => item.id === group.id ? { ...item, links: item.links.map((entry) => entry.id === link.id ? { ...entry, label: event.target.value } : entry) } : item) } })} /><input aria-label="Tujuan link" className={inputClass} value={link.href} onChange={(event) => onChange({ ...value, footer: { ...value.footer, groups: value.footer.groups.map((item) => item.id === group.id ? { ...item, links: item.links.map((entry) => entry.id === link.id ? { ...entry, href: event.target.value } : entry) } : item) } })} /><button type="button" onClick={() => onChange({ ...value, footer: { ...value.footer, groups: value.footer.groups.map((item) => item.id === group.id ? { ...item, links: item.links.filter((entry) => entry.id !== link.id) } : item) } })} className="h-11 w-11 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="mx-auto h-4 w-4" /></button></div>)}
              {group.links.length < 8 && <button type="button" onClick={() => onChange({ ...value, footer: { ...value.footer, groups: value.footer.groups.map((item) => item.id === group.id ? { ...item, links: [...item.links, { id: newId(), label: "Link baru", href: "/" }] } : item) } })} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-[#07B0C8]"><Plus className="h-4 w-4" />Tambah link</button>}
            </CollectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CmsWorkspace() {
  const toast = useToast();
  const [tab, setTab] = useState<WorkspaceTab>("PUBLIC_LANDING");
  const [document, setDocument] = useState<CmsDocumentResponse | null>(null);
  const [content, setContent] = useState<PublicLandingContent | RoleShellContent | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState("home");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [mobilePanel, setMobilePanel] = useState<"sections" | "editor" | "preview">("editor");
  const [publishOpen, setPublishOpen] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [assets, setAssets] = useState<CmsAsset[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFrame, setPreviewFrame] = useState({ scale: 0.275, height: 0 });
  const lastSavedRef = useRef("");
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  const activeKey: CmsDocumentKeyValue = tab === "BORROWER_SHELL" || tab === "DONOR_SHELL" ? tab : "PUBLIC_LANDING";
  const landing = content && "sections" in content ? content : null;
  const roleShell = content && !("sections" in content) ? content : null;
  const selectedSection = selectedSectionId.startsWith("__")
    ? undefined
    : landing?.sections.find((section) => section.id === selectedSectionId) || landing?.sections[0];

  const loadDocument = useCallback(async (key: CmsDocumentKeyValue) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/cms/${key}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal memuat dokumen");
      setDocument(payload.data);
      setContent(payload.data.draftContent);
      lastSavedRef.current = JSON.stringify(payload.data.draftContent);
      setStatus("idle");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat dokumen");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    const response = await fetch("/api/admin/cms/assets", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setAssets(payload.data || []);
  }, []);

  const loadRevisions = useCallback(async () => {
    const response = await fetch(`/api/admin/cms/${activeKey}/revisions`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setRevisions(payload.data || []);
  }, [activeKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tab === "HISTORY") {
        void loadRevisions();
      } else {
        void loadDocument(tab);
        void loadAssets();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAssets, loadDocument, loadRevisions, tab]);

  const markChanged = useCallback((next: PublicLandingContent | RoleShellContent) => {
    setContent(next);
    setStatus("dirty");
    setError("");
    setIssues([]);
  }, []);

  const saveDraft = useCallback(async () => {
    const current = content;
    if (!current || !document || status === "saving" || status === "conflict") return;
    const serialized = JSON.stringify(current);
    if (serialized === lastSavedRef.current) {
      setStatus("saved");
      return null;
    }
    setStatus("saving");
    try {
      const response = await fetch(`/api/admin/cms/${document.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedDraftVersion: document.draftVersion, content: current }),
      });
      const payload = await response.json();
      if (response.status === 409) {
        setStatus("conflict");
        setError(payload.error);
        return null;
      }
      if (!response.ok) {
        setIssues((payload.issues || []).map((issue: { message?: string }) => issue.message || "Konten tidak valid"));
        throw new Error(payload.error || "Gagal menyimpan draft");
      }
      setDocument(payload.data);
      setContent(payload.data.draftContent);
      lastSavedRef.current = JSON.stringify(payload.data.draftContent);
      setStatus("saved");
      return payload.data as CmsDocumentResponse;
    } catch (saveError) {
      setStatus("error");
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan draft");
      return null;
    }
  }, [content, document, status]);

  useEffect(() => {
    if (status !== "dirty") return;
    const timer = window.setTimeout(() => void saveDraft(), 1000);
    return () => window.clearTimeout(timer);
  }, [saveDraft, status]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveDraft();
      }
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "error") event.preventDefault();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [saveDraft, status]);

  useEffect(() => {
    const viewport = previewViewportRef.current;
    const canvas = previewCanvasRef.current;
    if (!viewport || !canvas) return;

    const fitPreview = () => {
      const availableWidth = Math.max(0, viewport.clientWidth - 16);
      const scale = Math.min(1, availableWidth / 1200);
      const height = canvas.scrollHeight * scale;
      setPreviewFrame((current) =>
        Math.abs(current.scale - scale) < 0.001 && Math.abs(current.height - height) < 1
          ? current
          : { scale, height }
      );
    };

    const observer = new ResizeObserver(fitPreview);
    observer.observe(viewport);
    observer.observe(canvas);
    fitPreview();
    return () => observer.disconnect();
  }, [landing, mobilePanel]);

  const publish = async () => {
    if (!document) return;
    let sourceDocument = document;
    if (status === "dirty" || status === "error") {
      const saved = await saveDraft();
      if (!saved) return;
      sourceDocument = saved;
    }
    setIsPublishing(true);
    setIssues([]);
    try {
      const response = await fetch(`/api/admin/cms/${sourceDocument.key}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedDraftVersion: sourceDocument.draftVersion, changeNote }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setIssues((payload.issues || []).map((issue: { message?: string }) => issue.message || "Konten tidak valid"));
        throw new Error(payload.error || "Publish gagal");
      }
      setDocument(payload.data);
      setPublishOpen(false);
      setChangeNote("");
      toast.success({ title: "Konten dipublikasikan", description: "Versi baru sedang direvalidasi di Vercel." });
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Publish gagal");
      toast.error({ title: "Publish gagal", description: publishError instanceof Error ? publishError.message : "Periksa kembali konten." });
    } finally {
      setIsPublishing(false);
    }
  };

  const uploadAsset = async (file: File) => {
    setIsUploading(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Pilih file gambar");
      const compressed = await compressImage(file);
      const metadata = {
        fileName: compressed.file.name,
        mimeType: compressed.file.type,
        sizeBytes: compressed.file.size,
        width: compressed.width,
        height: compressed.height,
        defaultAlt: compressed.file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      };
      const intentResponse = await fetch("/api/admin/cms/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intent.error || "Upload tidak dapat dimulai");
      const upload = await supabaseClient.storage
        .from(intent.data.bucket)
        .uploadToSignedUrl(intent.data.storagePath, intent.data.token, compressed.file, { contentType: compressed.file.type });
      if (upload.error) throw upload.error;
      const completeResponse = await fetch("/api/admin/cms/assets/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: intent.data.storagePath, ...metadata }),
      });
      const complete = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(complete.error || "Upload gagal diselesaikan");
      const asset = complete.data as CmsAsset;
      setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
      toast.success({ title: "Gambar berhasil diunggah", description: "Gambar baru langsung dipasang pada Hero." });
      return asset;
    } catch (uploadError) {
      toast.error({ title: "Upload gagal", description: uploadError instanceof Error ? uploadError.message : "Terjadi kesalahan." });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const validation = useMemo(() => {
    if (!content) return { success: false, errors: [] as string[] };
    const result = "sections" in content ? PublicLandingContentSchema.safeParse(content) : RoleShellContentSchema.safeParse(content);
    return result.success ? { success: true, errors: [] } : { success: false, errors: result.error.issues.map((issue) => issue.message) };
  }, [content]);

  const statusCopy: Record<SaveStatus, string> = {
    idle: "Draft siap",
    dirty: "Belum tersimpan",
    saving: "Menyimpan...",
    saved: "Tersimpan",
    conflict: "Konflik perubahan",
    error: "Gagal menyimpan",
  };

  return (
    <main className="mx-auto w-full max-w-350 px-4 py-6 sm:px-6 sm:py-8">
      <header className="sticky top-14.5 z-30 -mx-4 border-b border-gray-200 bg-[#F9FAFB]/95 px-4 pb-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#07B0C8]">Admin / Konten</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">CMS SalmanAid</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola konten tanpa mengubah struktur dan route aplikasi.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${status === "error" || status === "conflict" ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600"}`}>
              {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "saved" ? <Check className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4" />}
              {statusCopy[status]}
            </span>
            {status === "conflict" && <button type="button" onClick={() => void loadDocument(activeKey)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700"><RefreshCw className="h-4 w-4" />Muat terbaru</button>}
            <button type="button" onClick={() => void saveDraft()} disabled={!content || status === "saving" || status === "conflict"} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"><Save className="h-4 w-4" />Simpan</button>
            {tab !== "HISTORY" && <button type="button" onClick={() => setPublishOpen(true)} disabled={!validation.success || status === "conflict"} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#07B0C8] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0698AD] disabled:bg-gray-300"><CloudUpload className="h-4 w-4" />Publish</button>}
          </div>
        </div>
        <div className="mt-5 overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-1">
            {(Object.keys(tabLabels) as WorkspaceTab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 border-b-2 px-4 text-sm font-bold transition ${tab === item ? "border-[#07B0C8] text-[#07B0C8]" : "border-transparent text-gray-500 hover:text-slate-800"}`}>{item === "HISTORY" ? <History className="mr-2 inline h-4 w-4" /> : null}{tabLabels[item]}</button>)}
          </div>
        </div>
      </header>

      {(error || issues.length > 0 || validation.errors.length > 0) && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-extrabold">{error || "Beberapa konten belum valid"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{[...new Set([...issues, ...validation.errors])].slice(0, 8).map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      )}

      <div className="mt-4 flex rounded-xl border border-gray-200 bg-white p-1 lg:hidden">
        {(["sections", "editor", "preview"] as const).map((panel) => <button key={panel} type="button" onClick={() => setMobilePanel(panel)} className={`min-h-11 flex-1 rounded-lg text-sm font-bold capitalize ${mobilePanel === panel ? "bg-[#F0FBFD] text-[#07B0C8]" : "text-gray-500"}`}>{panel === "sections" ? "Bagian" : panel === "editor" ? "Editor" : "Preview"}</button>)}
      </div>

      {isLoading && tab !== "HISTORY" ? (
        <div className="mt-6 flex min-h-80 items-center justify-center rounded-xl border border-gray-200 bg-white"><Loader2 className="h-6 w-6 animate-spin text-[#07B0C8]" /></div>
      ) : tab === "HISTORY" ? (
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-xl font-extrabold">Riwayat Publish Landing Publik</h2>
          <div className="mt-5 divide-y divide-gray-100">
            {revisions.length === 0 && <p className="py-10 text-center text-sm text-gray-500">Belum ada revision.</p>}
            {revisions.map((revision) => <div key={revision.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-800">Version {revision.version}</p><p className="mt-1 text-sm text-gray-500">{revision.changeNote || "Tanpa catatan"} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.createdAt))}</p></div><button type="button" onClick={async () => { if (!confirm(`Restore version ${revision.version}?`)) return; const response = await fetch(`/api/admin/cms/${activeKey}/revisions/${revision.id}/restore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); if (response.ok) { toast.success({ title: "Revision dipulihkan" }); await loadRevisions(); } }} className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-bold text-slate-700 hover:bg-gray-50">Restore</button></div>)}
          </div>
        </section>
      ) : landing ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(400px,1fr)_360px]">
          <aside className={`${mobilePanel !== "sections" ? "hidden lg:block" : ""} rounded-xl border border-gray-200 bg-white p-3 lg:sticky lg:top-52 lg:h-fit`}>
            <div className="px-2 py-2"><h2 className="text-sm font-extrabold text-slate-900">Bagian halaman</h2><p className="mt-1 text-xs text-gray-500">Hero dan CTA tetap pada posisinya.</p></div>
            <div className="mt-2 space-y-1">
              {([["seo", "SEO & Metadata"], ["navbar", "Navbar Publik"], ["footer", "Footer Publik"]] as const).map(([id, label]) => <button key={id} type="button" onClick={() => { setSelectedSectionId(`__${id}`); setMobilePanel("editor"); }} className={`min-h-11 w-full rounded-lg px-3 text-left text-sm font-bold ${selectedSectionId === `__${id}` ? "bg-[#F0FBFD] text-[#07B0C8]" : "text-slate-700 hover:bg-gray-50"}`}>{label}</button>)}
              <div className="my-2 border-t border-gray-100" />
              {landing.sections.map((section, index) => <div key={section.id} className={`flex items-center rounded-lg border ${selectedSection?.id === section.id ? "border-cyan-200 bg-[#F0FBFD]" : "border-transparent hover:bg-gray-50"}`}><button type="button" onClick={() => { setSelectedSectionId(section.id); setMobilePanel("editor"); }} className="min-h-12 min-w-0 flex-1 px-3 text-left"><span className={`block truncate text-sm font-bold ${selectedSection?.id === section.id ? "text-[#07B0C8]" : "text-slate-700"}`}>{sectionLabels[section.type]}</span><span className="text-[11px] text-gray-400">{section.enabled ? "Tampil" : "Disembunyikan"}</span></button><button type="button" onClick={() => markChanged({ ...landing, sections: landing.sections.map((item) => item.id === section.id ? { ...item, enabled: !item.enabled } : item) })} aria-label={section.enabled ? "Sembunyikan section" : "Tampilkan section"} className={`mr-1 h-8 w-8 rounded-full ${section.enabled ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}><Eye className="mx-auto h-4 w-4" /></button>{index > 0 && index < landing.sections.length - 1 && <div className="mr-1 flex"><button type="button" disabled={index === 1} onClick={() => markChanged({ ...landing, sections: moveLandingSection(landing.sections, index, -1) })} className="h-8 w-7 text-gray-400 disabled:opacity-25"><ArrowUp className="mx-auto h-3.5 w-3.5" /></button><button type="button" disabled={index === landing.sections.length - 2} onClick={() => markChanged({ ...landing, sections: moveLandingSection(landing.sections, index, 1) })} className="h-8 w-7 text-gray-400 disabled:opacity-25"><ArrowDown className="mx-auto h-3.5 w-3.5" /></button></div>}</div>)}
            </div>
          </aside>
          <section className={`${mobilePanel !== "editor" ? "hidden lg:block" : ""} min-w-0 rounded-xl border border-gray-200 bg-white p-5 sm:p-6`}>
            <div className="mb-6 border-b border-gray-100 pb-4"><h2 className="text-xl font-extrabold text-slate-900">{selectedSectionId === "__seo" ? "SEO & Metadata" : selectedSectionId === "__navbar" ? "Navbar Publik" : selectedSectionId === "__footer" ? "Footer Publik" : selectedSection ? sectionLabels[selectedSection.type] : "Editor"}</h2><p className="mt-1 text-sm text-gray-500">Perubahan tersimpan otomatis setelah Anda berhenti mengetik.</p></div>
            {selectedSectionId === "__seo" || selectedSectionId === "__navbar" || selectedSectionId === "__footer" ? <PublicSettingsEditor panel={selectedSectionId.slice(2) as "seo" | "navbar" | "footer"} value={landing} onChange={markChanged} /> : selectedSection ? <LandingSectionEditor section={selectedSection} assets={assets} isUploading={isUploading} uploadImage={uploadAsset} update={(updated) => markChanged({ ...landing, sections: landing.sections.map((section) => section.id === updated.id ? updated : section) })} /> : null}
          </section>
          <aside className={`${mobilePanel !== "preview" ? "hidden xl:block" : ""} min-w-0`}>
            <div className="sticky top-52 rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-3"><h2 className="text-sm font-extrabold">Live preview desktop</h2><p className="text-xs text-gray-500">Renderer yang sama dengan produksi pada kanvas 1200 px.</p></div>
              <div ref={previewViewportRef} className="max-h-[70vh] overflow-x-hidden overflow-y-auto rounded-lg bg-slate-100 p-2">
                <div className="relative w-full" style={{ height: previewFrame.height }}>
                  <div
                    ref={previewCanvasRef}
                    className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-md bg-white shadow-sm"
                    style={{ width: 1200, transform: `scale(${previewFrame.scale})` }}
                  >
                    <LandingPageRenderer content={landing} metrics={zeroMetrics} />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : roleShell ? (
        <div className="mt-6"><RoleShellEditor value={roleShell} onChange={markChanged} /></div>
      ) : null}

      {publishOpen && document && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/55 px-4" onMouseDown={() => setPublishOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="publish-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 id="publish-title" className="text-xl font-extrabold text-slate-900">Publikasikan perubahan?</h2><p className="mt-2 text-sm leading-6 text-gray-500">Version baru akan tampil setelah cache Vercel direvalidasi. Version sebelumnya tetap tersedia di riwayat.</p></div><button type="button" onClick={() => setPublishOpen(false)} aria-label="Tutup" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button></div>
            <Field label="Catatan perubahan" hint="Opsional, maksimal 300 karakter." count={`${changeNote.length}/300`}><textarea className={textareaClass} maxLength={300} value={changeNote} onChange={(event) => setChangeNote(event.target.value)} placeholder="Contoh: Memperbarui hero dan program pendidikan" /></Field>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPublishOpen(false)} className="min-h-11 rounded-lg border border-gray-200 px-4 text-sm font-bold text-slate-700">Batal</button><button type="button" onClick={() => void publish()} disabled={isPublishing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#07B0C8] px-4 text-sm font-bold text-white disabled:opacity-50">{isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}Publish version {document.publishedVersion + 1}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
