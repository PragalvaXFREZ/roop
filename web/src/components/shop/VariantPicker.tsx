/*
 * Size and colour picker with the add-to-cart button.
 * Each size and colour pair is one variant. Each variant has its own stock.
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductDetail } from "@/lib/api";
import { addToCart, MAX_QTY, useCart } from "./cart";

/* Show "Only N left" at this stock or less. */
const LOW_STOCK = 3;

const unique = (values: string[]) => [...new Set(values)];

export function VariantPicker({ product }: { product: ProductDetail }) {
  const { variants } = product;
  const sizes = unique(variants.map((v) => v.size));
  const colors = unique(variants.map((v) => v.color));
  /* Select the option now if there is only one. */
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [color, setColor] = useState(colors[0] ?? "");
  const [added, setAdded] = useState(false);
  const cart = useCart();

  const variant = variants.find((v) => v.size === size && v.color === color);
  const inCart = cart.find((l) => l.variant_id === variant?.id)?.qty ?? 0;
  const limit = Math.min(variant?.stock ?? 0, MAX_QTY);
  const canAdd = !!variant && inCart < limit;

  let stock = "";
  if (!size) stock = "Choose a size.";
  else if (!variant) stock = "Not made in this size and colour.";
  else if (variant.stock === 0) stock = "Sold out";
  else if (variant.stock <= LOW_STOCK) stock = `Only ${variant.stock} left`;
  else stock = "In stock";

  function add() {
    if (!variant) return;
    const { slug, name, price, image } = product;
    addToCart({ variant_id: variant.id, slug, name, price, image, size: variant.size, color: variant.color }, variant.stock);
    setAdded(true);
  }

  return (
    <div className="space-y-6">
      <Options
        label="Colour"
        options={colors}
        value={color}
        onChange={(c) => {
          setColor(c);
          setAdded(false);
        }}
      />
      <Options
        label="Size"
        options={sizes}
        value={size}
        onChange={(s) => {
          setSize(s);
          setAdded(false);
        }}
        isOut={(s) => !variants.some((v) => v.size === s && v.color === color && v.stock > 0)}
      />

      <p className={`text-sm ${variant?.stock === 0 ? "text-danger" : "text-muted"}`} aria-live="polite">
        {stock}
        {inCart > 0 && ` · ${inCart} in your cart`}
      </p>

      <button
        type="button"
        onClick={add}
        disabled={!canAdd}
        className="w-full rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {variant?.stock === 0 ? "Sold out" : "Add to cart"}
      </button>

      {added && (
        <p className="text-sm" aria-live="polite">
          Added to your cart.{" "}
          <Link href="/cart" className="underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}

function Options({
  label,
  options,
  value,
  onChange,
  isOut,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  isOut?: (value: string) => boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm">
        {label}
        {value && <span className="text-muted">: {value}</span>}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          const out = isOut?.(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`min-w-12 rounded-sm border px-3 py-2 text-sm ${
                selected ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink"
              } ${out ? "line-through opacity-60" : ""}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
