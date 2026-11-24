/*
 * Form to add or edit a product, with its variants and images.
 * Without a product, the form adds a new one. Then it opens the edit page of the new product.
 * The API keeps prices in paisa. Staff enter rupees.
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type AdminProduct, type Category, type ProductIn } from "@/lib/api";
import { useLoad } from "./use-load";
import { button, danger, Field, input, primary } from "./ui";

type Row = { id?: number; size: string; color: string; stock: string };
type Text = "description" | "embroidery" | "fabric" | "care" | "price" | "category_id";
type Change = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/* Make a URL slug from a name, for example "Himal Shawl" to "himal-shawl". */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toRows(product?: AdminProduct): Row[] {
  if (!product) return [{ size: "", color: "", stock: "0" }];
  return product.variants.map((v) => ({ ...v, stock: String(v.stock) }));
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { data: categories } = useLoad<Category[]>("/api/admin/categories");
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    embroidery: product?.embroidery ?? "",
    fabric: product?.fabric ?? "",
    care: product?.care ?? "",
    price: product ? String(product.price / 100) : "",
    category_id: product?.category_id ? String(product.category_id) : "",
    is_published: product?.is_published ?? false,
    is_featured: product?.is_featured ?? false,
  });
  const [rows, setRows] = useState(toRows(product));
  const [images, setImages] = useState(product?.images ?? []);
  // The slug follows the name until staff edit the slug. An existing product keeps its slug.
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function bind(key: Text) {
    return {
      value: form[key],
      onChange: (e: Change) => setForm({ ...form, [key]: e.target.value }),
    };
  }

  function setRow(i: number, change: Partial<Row>) {
    setRows(rows.map((r, j) => (j === i ? { ...r, ...change } : r)));
  }

  /* Run one API call. Show its error, or the message when it succeeds. */
  async function run(action: () => Promise<void>, done = "") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(done);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const body: ProductIn = {
      ...form,
      price: Math.round(Number(form.price) * 100),
      category_id: form.category_id ? Number(form.category_id) : null,
      variants: rows.map((r) => ({
        id: r.id,
        size: r.size,
        color: r.color,
        stock: Number(r.stock),
      })),
    };
    run(async () => {
      const init = { method: product ? "PUT" : "POST", body: JSON.stringify(body) };
      const saved = await api<AdminProduct>(
        `/api/admin/products${product ? `/${product.id}` : ""}`,
        init,
      );
      if (!product) return router.replace(`/admin/products/${saved.id}`);
      // New variant rows get their id from the API. Keep the ids for the next save.
      setRows(toRows(saved));
    }, "Saved.");
  }

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !product) return;
    const data = new FormData();
    data.append("file", file);
    run(async () => {
      const init = { method: "POST", body: data };
      setImages((await api<AdminProduct>(`/api/admin/products/${product.id}/images`, init)).images);
    });
  }

  function removeImage(id: number) {
    if (!product) return;
    run(async () => {
      const init = { method: "DELETE" };
      setImages(
        (await api<AdminProduct>(`/api/admin/products/${product.id}/images/${id}`, init)).images,
      );
    });
  }

  function remove() {
    if (!product) return;
    run(async () => {
      await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
      router.replace("/admin/products");
    });
  }

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  slug: slugEdited ? form.slug : slugify(e.target.value),
                })
              }
              required
              className={input}
            />
          </Field>
          <Field label="Slug (the product address in the shop)">
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                setForm({ ...form, slug: e.target.value });
              }}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Lowercase letters, numbers and single dashes"
              className={input}
            />
          </Field>
          <Field label="Category">
            <select {...bind("category_id")} className={input}>
              <option value="">No category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (rupees)">
            <input type="number" min="1" step="any" required {...bind("price")} className={input} />
          </Field>
        </div>
        <Field label="Description">
          <textarea rows={4} {...bind("description")} className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Embroidery">
            <textarea rows={3} {...bind("embroidery")} className={input} />
          </Field>
          <Field label="Fabric">
            <textarea rows={3} {...bind("fabric")} className={input} />
          </Field>
          <Field label="Care">
            <textarea rows={3} {...bind("care")} className={input} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Published (visible in the shop)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured on the home page
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 font-semibold">Variants</legend>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_5rem_4.5rem] gap-2 text-sm text-muted">
              <span>Size</span>
              <span>Colour</span>
              <span>Stock</span>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_5rem_4.5rem] gap-2">
                <input
                  value={row.size}
                  onChange={(e) => setRow(i, { size: e.target.value })}
                  required
                  aria-label="Size"
                  className={input}
                />
                <input
                  value={row.color}
                  onChange={(e) => setRow(i, { color: e.target.value })}
                  required
                  aria-label="Colour"
                  className={input}
                />
                <input
                  type="number"
                  min="0"
                  value={row.stock}
                  onChange={(e) => setRow(i, { stock: e.target.value })}
                  required
                  aria-label="Stock"
                  className={input}
                />
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className={button}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows([...rows, { size: "", color: "", stock: "0" }])}
            className={`${button} mt-2`}
          >
            Add variant
          </button>
        </fieldset>

        {error && <p className="text-sm text-danger">{error}</p>}
        {message && <p className="text-sm">{message}</p>}
        <button disabled={busy} className={primary}>
          {product ? "Save changes" : "Add product"}
        </button>
      </form>

      <section>
        <h2 className="mb-2 font-semibold">Images</h2>
        {!product ? (
          <p className="text-sm text-muted">Add the product first. Then you can add images.</p>
        ) : (
          <>
            {images.length === 0 && <p className="mb-2 text-sm text-muted">No images yet.</p>}
            <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <li key={img.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Admin thumbnails do not need optimisation. */}
                  <img
                    src={img.url}
                    alt=""
                    className="aspect-square w-full rounded border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    disabled={busy}
                    className="text-sm text-danger underline underline-offset-2"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <Field label="Add an image (JPEG, PNG or WebP, 5 MB or smaller)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={upload}
                disabled={busy}
                className="text-sm"
              />
            </Field>
          </>
        )}
      </section>

      {product && (
        <section>
          <h2 className="mb-2 font-semibold">Delete product</h2>
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Delete {product.name}? You cannot undo this.</span>
              <button type="button" onClick={remove} disabled={busy} className={danger}>
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className={button}>
                No
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={danger}>
              Delete product
            </button>
          )}
        </section>
      )}
    </div>
  );
}
